'use client';
import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Clock, CalendarPlus, History, Check, X, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, RefreshCw, MessageSquare, UserPlus, Briefcase, CalendarOff, AlertCircle, CheckCircle2 } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import { getEstadoStyle, ESTADO_COBERTURA_STYLES } from '@/app/lib/constants';
import { formatDate, formatDateDMY, formatTime } from '@/app/lib/dates';

type TabType = 'revision' | 'coberturas' | 'crear' | 'historial';
type SubFilter = 'todos' | 'planificacion' | 'horas' | 'ausencias';

import type { SolicitudCobertura } from '@/app/types';
interface PendingItem {
    id: string; tipo: 'planificacion' | 'hora' | 'ausencia';
    empleado_id: string; nombre_empleado: string;
    detalle: string; fecha: string; estado_id: number;
    extra?: string;
}
// Empleado type from shared types (uses full Empleado, only needs empleado_id + nombre_empleado fields)
import type { Empleado } from '@/app/types';

const estadoIdInfo = (id: number) => {
    const s = getEstadoStyle(id);
    return { label: s.label, color: `${s.bg} ${s.color}`, border: s.border };
};

// =========== Crear Solicitud (Cobertura) subcomponent ===========
function CrearSolicitudTab({ empleados, onCreated }: { empleados: Empleado[]; onCreated: () => void }) {
    const { user } = useUser();
    const [crearEmpleado, setCrearEmpleado] = useState('');
    const [crearMotivo, setCrearMotivo] = useState('');
    const [crearDescripcion, setCrearDescripcion] = useState('');
    const [crearInicio, setCrearInicio] = useState('');
    const [crearFin, setCrearFin] = useState('');
    const [crearError, setCrearError] = useState('');
    const [crearSuccess, setCrearSuccess] = useState('');
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [rangeMode, setRangeMode] = useState<'start' | 'end'>('start');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
    const getDays = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
    const getFirst = (m: number, y: number) => new Date(y, m, 1).getDay();
    const secondMonth = calMonth === 11 ? 0 : calMonth + 1;
    const secondYear = calMonth === 11 ? calYear + 1 : calYear;
    const isInRange = (day: number, month: number, year: number) => {
        if (!crearInicio || !crearFin) return false;
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return ds >= crearInicio && ds <= crearFin;
    };
    const isTodayFn = (day: number, month: number, year: number) => {
        const t = new Date(); return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
    };
    const diasSel = useMemo(() => {
        if (!crearInicio || !crearFin) return 0;
        return Math.max(0, Math.ceil((new Date(crearFin).getTime() - new Date(crearInicio).getTime()) / 86400000) + 1);
    }, [crearInicio, crearFin]);

    const handleClick = (day: number, month: number, year: number) => {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (rangeMode === 'start') { setCrearInicio(ds); setRangeMode('end'); if (ds > crearFin) setCrearFin(ds); }
        else { if (ds < crearInicio) setCrearInicio(ds); else setCrearFin(ds); setRangeMode('start'); }
    };
    const renderCal = (month: number, year: number) => {
        const days = getDays(month, year); const first = getFirst(month, year);
        return (
            <div className="bg-black/20 rounded-xl border border-white/5 p-3">
                <div className="text-center mb-2"><span className="text-sm font-bold text-white">{monthNames[month]} {year}</span></div>
                <div className="grid grid-cols-7 gap-0.5">
                    {dayNames.map(d => <div key={`${month}-${d}`} className="text-center text-[10px] text-gray-500 font-bold py-1">{d}</div>)}
                    {Array.from({ length: first }).map((_, i) => <div key={`e-${month}-${i}`} className="py-2"></div>)}
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1; const inR = isInRange(day, month, year); const td = isTodayFn(day, month, year);
                        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isS = ds === crearInicio; const isE = ds === crearFin;
                        return (
                            <button key={`${month}-${day}`} onClick={() => handleClick(day, month, year)}
                                className={`text-center py-2 text-xs rounded-lg transition-all cursor-pointer
                                    ${isS || isE ? 'bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/30' : inR ? 'bg-indigo-600/30 text-indigo-200 font-bold hover:bg-indigo-600/50' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                                    ${td ? 'ring-1 ring-amber-400' : ''}`}>{day}</button>);
                    })}
                </div>
            </div>);
    };
    const prevM = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
    const nextM = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };
    const crearSolicitud = async () => {
        setCrearError(''); setCrearSuccess('');
        if (!crearEmpleado || !crearMotivo || !crearInicio || !crearFin) { setCrearError('Todos los campos obligatorios deben llenarse'); return; }
        try {
            const res = await fetch(`${API_BASE}/solicitudes`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empleado_id: crearEmpleado, creado_por: user?.empleado_id, motivo: crearMotivo, descripcion: crearDescripcion || null, fecha_inicio: `${crearInicio}T00:00:00`, fecha_fin: `${crearFin}T23:59:59` }) });
            if (res.ok) {
                setCrearSuccess('Solicitud de cobertura enviada'); setCrearEmpleado(''); setCrearMotivo(''); setCrearDescripcion(''); setCrearInicio(''); setCrearFin('');
                onCreated(); setTimeout(() => setCrearSuccess(''), 3000);
            } else { const d = await res.json(); setCrearError(d.error || 'Error al crear'); }
        } catch { setCrearError('Error de conexión'); }
    };
    return (
        <div className="flex flex-col gap-4">
            <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><CalendarPlus className="w-4 h-4 text-indigo-400" />Crear Solicitud de Cobertura</h3>
                <p className="text-xs text-gray-400 mb-4">Solicita a un trabajador que cubra una posición. El trabajador recibirá la solicitud y podrá aceptar o rechazar.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Trabajador a cubrir</label>
                        <select value={crearEmpleado} onChange={e => setCrearEmpleado(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                            <option value="">Seleccionar...</option>{empleados.map(e => <option key={e.empleado_id} value={e.empleado_id}>{e.nombre_empleado}</option>)}</select></div>
                    <div><label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Motivo *</label>
                        <input type="text" value={crearMotivo} onChange={e => setCrearMotivo(e.target.value)} placeholder="Ej: Vacaciones de Juan" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" /></div>
                </div>
                <div><label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Descripción (opcional)</label>
                    <textarea value={crearDescripcion} onChange={e => setCrearDescripcion(e.target.value)} placeholder="Detalles adicionales..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none h-16" /></div>
            </div>
            <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl border text-center transition-all ${rangeMode === 'start' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-black/20 border-white/5'}`}><p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Inicio</p><p className="text-sm font-bold text-indigo-300">{crearInicio ? formatDateDMY(crearInicio) : '—'}</p></div>
                    <div className="flex flex-col items-center gap-0.5"><span className="text-lg font-black text-indigo-400">{diasSel || '—'}</span><span className="text-[9px] text-gray-500 uppercase tracking-wider">días</span></div>
                    <div className={`p-2.5 rounded-xl border text-center transition-all ${rangeMode === 'end' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-black/20 border-white/5'}`}><p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Fin</p><p className="text-sm font-bold text-indigo-300">{crearFin ? formatDateDMY(crearFin) : '—'}</p></div>
                </div>
                <div className="flex items-center justify-between mb-3">
                    <button onClick={prevM} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 text-gray-400" /></button>
                    <span className="text-xs text-gray-400">{monthNames[calMonth]} — {monthNames[secondMonth]} {secondYear}</span>
                    <button onClick={nextM} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">{renderCal(calMonth, calYear)}{renderCal(secondMonth, secondYear)}</div>
            </div>
            {crearError && <div className="p-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs text-center">{crearError}</div>}
            {crearSuccess && <div className="p-2 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 text-xs text-center">{crearSuccess}</div>}
            <button onClick={crearSolicitud} className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"><CalendarPlus className="w-4 h-4" /> Enviar Solicitud</button>
        </div>
    );
}

// =========== Modal Reasignar ===========
function ModalReasignar({ solicitud, empleados, onClose, onDone }: { solicitud: SolicitudCobertura; empleados: Empleado[]; onClose: () => void; onDone: () => void; }) {
    const [nuevoEmpleado, setNuevoEmpleado] = useState('');
    const [loading, setLoading] = useState(false);
    const reasignar = async () => {
        if (!nuevoEmpleado) return; setLoading(true);
        try { await fetch(`${API_BASE}/solicitudes/${solicitud.solicitud_id}/reasignar`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empleado_id: nuevoEmpleado }) }); onDone(); } catch { } setLoading(false);
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[#1e2336] rounded-2xl border border-[#3b4256] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><UserPlus className="w-5 h-5 text-indigo-400" />Reasignar Solicitud</h3>
                <p className="text-xs text-gray-400 mb-4">La solicitud &quot;{solicitud.motivo}&quot; fue rechazada por {solicitud.nombre_asignado}.
                    {solicitud.motivo_rechazo && <span className="block mt-1 text-red-400"><MessageSquare className="w-3 h-3 inline mr-1" />Motivo: &quot;{solicitud.motivo_rechazo}&quot;</span>}</p>
                <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Asignar a nuevo trabajador</label>
                <select value={nuevoEmpleado} onChange={e => setNuevoEmpleado(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer mb-4">
                    <option value="">Seleccionar...</option>{empleados.filter(e => e.empleado_id !== solicitud.empleado_id).map(e => <option key={e.empleado_id} value={e.empleado_id}>{e.nombre_empleado}</option>)}</select>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm cursor-pointer">Cancelar</button>
                    <button onClick={reasignar} disabled={!nuevoEmpleado || loading} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}Reasignar</button>
                </div>
            </div>
        </div>
    );
}

// =========== Main Component ===========
export default function SolicitudesLiderPanel() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>('revision');
    const [subFilter, setSubFilter] = useState<SubFilter>('todos');
    const [solicitudes, setSolicitudes] = useState<SolicitudCobertura[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reasignarSolicitud, setReasignarSolicitud] = useState<SolicitudCobertura | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const getLiderId = (): string => {
        return user?.empleado_id || '';
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const liderId = getLiderId();
            const [solRes, empRes, planRes, horaRes, ausRes] = await Promise.all([
                fetch(`${API_BASE}/solicitudes/lider/${liderId}`),
                fetch(`${API_BASE}/empleados`),
                fetch(`${API_BASE}/planificacion`),
                fetch(`${API_BASE}/hora`),
                fetch(`${API_BASE}/ausencias`),
            ]);

            const [solData, empData, planData, horaData, ausData] = await Promise.all([
                solRes.json(), empRes.json(), planRes.json(), horaRes.json(), ausRes.json()
            ]);

            if (Array.isArray(solData)) setSolicitudes(solData);
            if (Array.isArray(empData)) setEmpleados(empData);

            // Build pending items from planificacion, horas, ausencias
            const items: PendingItem[] = [];

            // Planificaciones pendientes
            if (Array.isArray(planData)) {
                planData.filter((p: any) => p.estado_id === 1).forEach((p: any) => {
                    items.push({
                        id: p.plan_id, tipo: 'planificacion',
                        empleado_id: p.empleado_id,
                        nombre_empleado: p.nombre_empleado || empData.find((e: any) => e.empleado_id === p.empleado_id)?.nombre_empleado || p.empleado_id,
                        detalle: `${formatTime(p.inicio_turno)} - ${formatTime(p.fin_turno)}`,
                        fecha: p.inicio_turno, estado_id: p.estado_id
                    });
                });
            }

            // Horas pendientes
            if (Array.isArray(horaData)) {
                horaData.filter((h: any) => h.estado_id === 1).forEach((h: any) => {
                    items.push({
                        id: h.registro_id, tipo: 'hora',
                        empleado_id: h.empleado_id,
                        nombre_empleado: empData.find((e: any) => e.empleado_id === h.empleado_id)?.nombre_empleado || h.empleado_id,
                        detalle: `${formatTime(h.inicio_trabajo)}${h.fin_trabajo ? ' - ' + formatTime(h.fin_trabajo) : ' - En curso'}`,
                        fecha: h.inicio_trabajo, estado_id: h.estado_id,
                        extra: !h.fin_trabajo ? 'En curso' : undefined
                    });
                });
            }

            // Ausencias pendientes (solo las que requieren aprobación)
            if (Array.isArray(ausData)) {
                ausData.filter((a: any) => a.estado_id === 1 && a.requiere_aprobacion).forEach((a: any) => {
                    items.push({
                        id: a.ausencia_id, tipo: 'ausencia',
                        empleado_id: a.empleado_id,
                        nombre_empleado: a.nombre_empleado || empData.find((e: any) => e.empleado_id === a.empleado_id)?.nombre_empleado || a.empleado_id,
                        detalle: a.motivo || 'Ausencia',
                        fecha: a.inicio_ausencia, estado_id: a.estado_id,
                        extra: `${formatDate(a.inicio_ausencia)} - ${formatDate(a.fin_ausencia)}`
                    });
                });
            }

            setPendingItems(items);
        } catch (err) { console.error('Error fetching data:', err); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    // Approve/Reject a pending item
    const updateItemEstado = async (item: PendingItem, nuevoEstado: number) => {
        setUpdatingId(item.id);
        try {
            let url = '';
            if (item.tipo === 'planificacion') url = `${API_BASE}/planificacion/${item.id}/estado`;
            else if (item.tipo === 'hora') url = `${API_BASE}/hora/${item.id}/estado`; // might not exist, handle below
            else if (item.tipo === 'ausencia') url = `${API_BASE}/ausencias/${item.id}/estado`;

            const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado_id: nuevoEstado }) });
            if (res.ok) {
                setPendingItems(prev => prev.filter(p => p.id !== item.id));
            }
        } catch (err) { console.error('Error updating estado:', err); }
        setUpdatingId(null);
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        if (subFilter === 'todos') return pendingItems;
        const map: Record<string, string> = { planificacion: 'planificacion', horas: 'hora', ausencias: 'ausencia' };
        return pendingItems.filter(i => i.tipo === map[subFilter]);
    }, [pendingItems, subFilter]);

    // Group by employee
    const groupedItems = useMemo(() => {
        const groups: Record<string, PendingItem[]> = {};
        filteredItems.forEach(item => {
            if (!groups[item.empleado_id]) groups[item.empleado_id] = [];
            groups[item.empleado_id].push(item);
        });
        return groups;
    }, [filteredItems]);

    // Coberturas
    const pendientesCob = useMemo(() => solicitudes.filter(s => s.estado === 'pendiente'), [solicitudes]);
    const rechazadasCob = useMemo(() => solicitudes.filter(s => s.estado === 'rechazada'), [solicitudes]);

    // Counts
    const countPlan = pendingItems.filter(i => i.tipo === 'planificacion').length;
    const countHora = pendingItems.filter(i => i.tipo === 'hora').length;
    const countAus = pendingItems.filter(i => i.tipo === 'ausencia').length;
    const countCob = pendientesCob.length + rechazadasCob.length;

    const tipoIcon = (tipo: string) => {
        if (tipo === 'planificacion') return <Briefcase className="w-4 h-4 text-cyan-400" />;
        if (tipo === 'hora') return <Clock className="w-4 h-4 text-amber-400" />;
        return <CalendarOff className="w-4 h-4 text-rose-400" />;
    };
    const tipoColor = (tipo: string) => {
        if (tipo === 'planificacion') return 'border-cyan-500/30 hover:border-cyan-500/50';
        if (tipo === 'hora') return 'border-amber-500/30 hover:border-amber-500/50';
        return 'border-rose-500/30 hover:border-rose-500/50';
    };
    const tipoBadge = (tipo: string) => {
        if (tipo === 'planificacion') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
        if (tipo === 'hora') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    };
    const tipoLabel = (tipo: string) => {
        if (tipo === 'planificacion') return 'Turno';
        if (tipo === 'hora') return 'Hora';
        return 'Ausencia';
    };

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const toggleGroup = (id: string) => setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));

    const calcDias = (ini: string, fin: string) => Math.max(1, Math.ceil((new Date(fin).getTime() - new Date(ini).getTime()) / 86400000) + 1);

    const tabsList = [
        { key: 'revision' as TabType, label: 'Revisiones', icon: <AlertCircle className="w-4 h-4" />, count: pendingItems.length },
        { key: 'coberturas' as TabType, label: 'Coberturas', icon: <ClipboardList className="w-4 h-4" />, count: countCob },
        { key: 'crear' as TabType, label: 'Crear Solicitud', icon: <CalendarPlus className="w-4 h-4" /> },
        { key: 'historial' as TabType, label: 'Historial', icon: <History className="w-4 h-4" /> },
    ];

    return (
        <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-6 h-6 text-violet-400" />Solicitudes y Revisiones</h2>
                <p className="text-gray-300 text-sm mt-1">Revisa pendientes de tu equipo y gestiona solicitudes de cobertura</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {tabsList.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
                            ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-[#1e2336]/80 text-gray-400 hover:text-white hover:bg-[#2a3050]/80 border border-[#3b4256]/50'}`}>
                        {tab.icon}{tab.label}
                        {tab.count !== undefined && tab.count > 0 && <span className="ml-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div> : (
                <>
                    {/* ========== TAB: REVISIONES ========== */}
                    {activeTab === 'revision' && (
                        <div className="flex flex-col gap-4">
                            {/* Sub-filters */}
                            <div className="flex gap-2">
                                {[
                                    { key: 'todos' as SubFilter, label: 'Todos', count: pendingItems.length },
                                    { key: 'planificacion' as SubFilter, label: 'Turnos', count: countPlan, colr: 'text-cyan-400' },
                                    { key: 'horas' as SubFilter, label: 'Horas', count: countHora, colr: 'text-amber-400' },
                                    { key: 'ausencias' as SubFilter, label: 'Ausencias', count: countAus, colr: 'text-rose-400' },
                                ].map(sf => (
                                    <button key={sf.key} onClick={() => setSubFilter(sf.key)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                                            ${subFilter === sf.key ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                                        {sf.label}
                                        {sf.count > 0 && <span className={`text-[10px] ${sf.colr || 'text-gray-400'}`}>({sf.count})</span>}
                                    </button>
                                ))}
                            </div>

                            {/* Items grouped by employee */}
                            {Object.keys(groupedItems).length === 0 ? (
                                <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-8 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No hay pendientes por revisar</p>
                                </div>
                            ) : (
                                Object.entries(groupedItems).map(([empId, items]) => {
                                    const empName = items[0]?.nombre_empleado || empId;
                                    const isOpen = expandedGroups[empId] !== false; // default open
                                    return (
                                        <div key={empId} className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 overflow-hidden">
                                            <button onClick={() => toggleGroup(empId)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">{empName.charAt(0)}</div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">{empName}</p>
                                                        <p className="text-[10px] text-gray-400">{items.length} pendiente{items.length > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </button>
                                            {isOpen && (
                                                <div className="border-t border-white/5 p-3 flex flex-col gap-1.5">
                                                    {items.map(item => (
                                                        <div key={item.id} className={`flex items-center justify-between p-3 bg-black/20 rounded-xl border transition-all ${tipoColor(item.tipo)}`}>
                                                            <div className="flex items-center gap-3">
                                                                {tipoIcon(item.tipo)}
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-medium text-white">{item.detalle}</p>
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tipoBadge(item.tipo)}`}>{tipoLabel(item.tipo)}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {formatDate(item.fecha)}
                                                                        {item.extra && <span className="ml-2 text-gray-500">· {item.extra}</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                                <button onClick={() => updateItemEstado(item, 2)} disabled={updatingId === item.id}
                                                                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                                                                    {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Aprobar
                                                                </button>
                                                                <button onClick={() => updateItemEstado(item, 5)} disabled={updatingId === item.id}
                                                                    className="flex items-center gap-1 bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ========== TAB: COBERTURAS ========== */}
                    {activeTab === 'coberturas' && (
                        <div className="flex flex-col gap-4">
                            {rechazadasCob.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Rechazadas — Requieren reasignación</h3>
                                    {rechazadasCob.map(s => (
                                        <div key={s.solicitud_id} className="flex items-center justify-between p-4 bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-red-500/30">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">{s.motivo}</p>
                                                <p className="text-[10px] text-gray-400">Asignado a <span className="text-red-300 font-medium">{s.nombre_asignado}</span> · {formatDate(s.fecha_inicio)} al {formatDate(s.fecha_fin)} · {calcDias(s.fecha_inicio, s.fecha_fin)} días</p>
                                                {s.motivo_rechazo && <p className="text-[10px] text-red-400/80 mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> &quot;{s.motivo_rechazo}&quot;</p>}
                                            </div>
                                            <button onClick={() => setReasignarSolicitud(s)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ml-3"><RefreshCw className="w-3.5 h-3.5" /> Reasignar</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {pendientesCob.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Esperando respuesta del trabajador</h3>
                                    {pendientesCob.map(s => (
                                        <div key={s.solicitud_id} className="flex items-center justify-between p-4 bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">{s.nombre_asignado.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{s.motivo}</p>
                                                    <p className="text-[10px] text-gray-400">Para <span className="text-indigo-300 font-medium">{s.nombre_asignado}</span> · {formatDate(s.fecha_inicio)} al {formatDate(s.fecha_fin)} · {calcDias(s.fecha_inicio, s.fecha_fin)} días</p>
                                                    {s.descripcion && <p className="text-[10px] text-gray-500 mt-0.5">{s.descripcion}</p>}
                                                </div>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 shrink-0">Pendiente</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {pendientesCob.length === 0 && rechazadasCob.length === 0 && (
                                <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-8 text-center">
                                    <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" /><p className="text-gray-400 text-sm">No hay coberturas pendientes</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== TAB: CREAR ========== */}
                    {activeTab === 'crear' && <CrearSolicitudTab empleados={empleados} onCreated={fetchAll} />}

                    {/* ========== TAB: HISTORIAL ========== */}
                    {activeTab === 'historial' && (
                        <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-4">
                            <p className="text-xs text-gray-400 mb-3">{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} de cobertura</p>
                            {solicitudes.length === 0 ? <p className="text-gray-500 text-sm text-center py-6">Sin registros</p> : (
                                <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {solicitudes.map(s => (
                                        <div key={s.solicitud_id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">{s.nombre_asignado.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{s.nombre_asignado}</p>
                                                    <p className="text-[10px] text-gray-400">{s.motivo} · {formatDate(s.fecha_inicio)} al {formatDate(s.fecha_fin)}</p>
                                                    {s.estado === 'rechazada' && s.motivo_rechazo && <p className="text-[10px] text-red-400/70 flex items-center gap-1 mt-0.5"><MessageSquare className="w-2.5 h-2.5" /> {s.motivo_rechazo}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ESTADO_COBERTURA_STYLES[s.estado]?.color || 'bg-gray-500/20 text-gray-400'}`}>{ESTADO_COBERTURA_STYLES[s.estado]?.label || s.estado}</span>
                                                {s.estado === 'rechazada' && <button onClick={() => setReasignarSolicitud(s)} className="flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"><RefreshCw className="w-3 h-3" /> Reasignar</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {reasignarSolicitud && <ModalReasignar solicitud={reasignarSolicitud} empleados={empleados} onClose={() => setReasignarSolicitud(null)} onDone={() => { setReasignarSolicitud(null); fetchAll(); }} />}
        </div>
    );
}
