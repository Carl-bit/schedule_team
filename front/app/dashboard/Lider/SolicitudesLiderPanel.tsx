'use client';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, Clock, CalendarPlus, History, Check, X, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, RefreshCw, MessageSquare, UserPlus, Briefcase, CalendarOff, AlertCircle, CheckCircle2 } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import { getEstadoStyle, ESTADO_COBERTURA_STYLES } from '@/app/lib/constants';
import { formatDate, formatDateDMY, formatTime } from '@/app/lib/dates';

type TabType = 'revision' | 'coberturas' | 'crear' | 'historial';
type SubFilter = 'todos' | 'planificacion' | 'horas';

import type { SolicitudCobertura, EtiquetaHorario } from '@/app/types';
interface PendingItem {
    id: string; tipo: 'planificacion' | 'hora';
    empleado_id: string; nombre_empleado: string;
    detalle: string; fecha: string; estado_id: number;
    extra?: string;
}
interface AusenciaPendiente {
    ausencia_id: string;
    empleado_id: string;
    nombre_empleado: string;
    motivo: string;
    inicio_ausencia: string;
    fin_ausencia: string;
    estado_id: number;
}
// Empleado type from shared types (uses full Empleado, only needs empleado_id + nombre_empleado fields)
import type { Empleado } from '@/app/types';

const estadoIdInfo = (id: number) => {
    const s = getEstadoStyle(id);
    return { label: s.label, color: `${s.bg} ${s.color}`, border: s.border };
};

// =========== Crear Solicitud (Cobertura) subcomponent ===========
function CrearSolicitudTab({ empleados, onCreated, onNotify }: { empleados: Empleado[]; onCreated: () => void; onNotify: (message: string, type: 'success' | 'error') => void }) {
    const { user } = useUser();
    const [crearEmpleado, setCrearEmpleado] = useState('');
    const [crearMotivo, setCrearMotivo] = useState('');
    const [crearDescripcion, setCrearDescripcion] = useState('');
    const [crearInicio, setCrearInicio] = useState('');
    const [crearFin, setCrearFin] = useState('');
    const [crearError, setCrearError] = useState('');
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
        setCrearError('');
        if (!crearEmpleado || !crearMotivo || !crearInicio || !crearFin) { setCrearError('Todos los campos obligatorios deben llenarse'); return; }
        try {
            const res = await fetch(`${API_BASE}/solicitudes`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empleado_id: crearEmpleado, creado_por: user?.empleado_id, motivo: crearMotivo, descripcion: crearDescripcion || null, fecha_inicio: `${crearInicio}T00:00:00`, fecha_fin: `${crearFin}T23:59:59` }) });
            if (res.ok) {
                setCrearEmpleado(''); setCrearMotivo(''); setCrearDescripcion(''); setCrearInicio(''); setCrearFin('');
                onCreated();
                onNotify('Solicitud de cobertura enviada correctamente', 'success');
            } else { const d = await res.json(); onNotify(d.error || 'Error al crear la solicitud', 'error'); }
        } catch { onNotify('Error de conexion al crear la solicitud', 'error'); }
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
    const [ausenciasPendientes, setAusenciasPendientes] = useState<AusenciaPendiente[]>([]);
    const [etiquetasCompartidas, setEtiquetasCompartidas] = useState<EtiquetaHorario[]>([]);
    const [loading, setLoading] = useState(true);
    const [reasignarSolicitud, setReasignarSolicitud] = useState<SolicitudCobertura | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [rechazarItem, setRechazarItem] = useState<PendingItem | null>(null);
    const [motivoRevision, setMotivoRevision] = useState('');

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const getLiderId = (): string => {
        return user?.empleado_id || '';
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const liderId = getLiderId();
            const [solRes, empRes, planRes, horaRes, ausRes, etqRes] = await Promise.all([
                fetch(`${API_BASE}/solicitudes/lider/${liderId}`),
                fetch(`${API_BASE}/empleados`),
                fetch(`${API_BASE}/planificacion`),
                fetch(`${API_BASE}/hora`),
                fetch(`${API_BASE}/ausencias`),
                fetch(`${API_BASE}/etiquetas/compartidas`),
            ]);

            const [solData, empData, planData, horaData, ausData, etqData] = await Promise.all([
                solRes.json(), empRes.json(), planRes.json(), horaRes.json(), ausRes.json(), etqRes.json()
            ]);
            if (Array.isArray(etqData)) setEtiquetasCompartidas(etqData);

            if (Array.isArray(solData)) setSolicitudes(solData);
            if (Array.isArray(empData)) setEmpleados(empData);

            // Build pending items from planificacion, horas, ausencias
            const items: PendingItem[] = [];

            // Planificaciones pendientes
            if (Array.isArray(planData)) {
                planData.filter((p: any) => p.estado_id === 1 || p.estado_id === 4).forEach((p: any) => {
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
                horaData.filter((h: any) => h.estado_id === 1 || h.estado_id === 4).forEach((h: any) => {
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

            // Ausencias pendientes (solo las que requieren aprobacion) - van al tab de Coberturas
            const ausenciasItems: AusenciaPendiente[] = [];
            if (Array.isArray(ausData)) {
                ausData.filter((a: any) => (a.estado_id === 1 || a.estado_id === 4) && a.requiere_aprobacion).forEach((a: any) => {
                    ausenciasItems.push({
                        ausencia_id: a.ausencia_id,
                        empleado_id: a.empleado_id,
                        nombre_empleado: a.nombre_empleado || empData.find((e: any) => e.empleado_id === a.empleado_id)?.nombre_empleado || a.empleado_id,
                        motivo: a.motivo || 'Ausencia',
                        inicio_ausencia: a.inicio_ausencia,
                        fin_ausencia: a.fin_ausencia,
                        estado_id: a.estado_id,
                    });
                });
            }

            setPendingItems(items);
            setAusenciasPendientes(ausenciasItems);
        } catch (err) { console.error('Error fetching data:', err); }
        setLoading(false);
    };

    useEffect(() => {
        if (user?.empleado_id) fetchAll();
    }, [user?.empleado_id]);

    const getItemUrl = (item: PendingItem) => {
        if (item.tipo === 'planificacion') return `${API_BASE}/planificacion/${item.id}/estado`;
        return `${API_BASE}/hora/${item.id}/estado`;
    };

    const tipoNombre = (tipo: string) => tipo === 'planificacion' ? 'Planificacion' : 'Hora';

    // Coberturas asociadas a una ausencia: prioriza FK ausencia_id; fallback heuristico para datos previos a la migracion
    const coberturasParaAusencia = (aus: AusenciaPendiente): SolicitudCobertura[] => {
        const linked = solicitudes.filter(s => s.ausencia_id === aus.ausencia_id);
        if (linked.length > 0) return linked;
        const ai = new Date(aus.inicio_ausencia).getTime();
        const af = new Date(aus.fin_ausencia).getTime();
        return solicitudes.filter(s => {
            if (s.ausencia_id) return false;
            if (s.empleado_id === aus.empleado_id) return false;
            if (s.motivo !== aus.motivo) return false;
            const si = new Date(s.fecha_inicio).getTime();
            const sf = new Date(s.fecha_fin).getTime();
            return si <= af && sf >= ai;
        });
    };

    // Cobertura activa (la mas reciente que no este rechazada)
    const coberturaActiva = (aus: AusenciaPendiente): SolicitudCobertura | undefined => {
        const cobs = coberturasParaAusencia(aus);
        return cobs.find(c => c.estado === 'aceptada') || cobs.find(c => c.estado === 'pendiente');
    };

    // IDs de empleados que ya rechazaron la cobertura para esta ausencia
    const empleadosRechazaron = (aus: AusenciaPendiente): string[] => {
        return coberturasParaAusencia(aus).filter(c => c.estado === 'rechazada').map(c => c.empleado_id);
    };

    // Helper: lista de fechas YYYY-MM-DD entre inicio y fin (inclusivo)
    const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const diasRango = (ini: string, fin: string): string[] => {
        const out: string[] = [];
        const start = new Date(ini); start.setHours(0, 0, 0, 0);
        const end = new Date(fin); end.setHours(0, 0, 0, 0);
        const cur = new Date(start);
        while (cur <= end) { out.push(dayKey(cur)); cur.setDate(cur.getDate() + 1); }
        return out;
    };
    const fmtDiaLabel = (ds: string) => {
        const d = new Date(ds + 'T12:00:00');
        return d.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' });
    };

    // Selecciones por ausencia
    const [seleccionCubridor, setSeleccionCubridor] = useState<Record<string, string>>({});
    // ausencia_id -> { dateStr -> etiqueta_ids[] }
    const [seleccionEtiquetasPorDia, setSeleccionEtiquetasPorDia] = useState<Record<string, Record<string, string[]>>>({});
    const [notaCobertura, setNotaCobertura] = useState<Record<string, string>>({});

    const toggleEtiquetaDia = (ausId: string, ds: string, etqId: string) => {
        setSeleccionEtiquetasPorDia(prev => {
            const ausMap = { ...(prev[ausId] || {}) };
            const list = ausMap[ds] || [];
            ausMap[ds] = list.includes(etqId) ? list.filter(x => x !== etqId) : [...list, etqId];
            return { ...prev, [ausId]: ausMap };
        });
    };
    const aplicarDiaATodos = (ausId: string, ds: string, dias: string[]) => {
        setSeleccionEtiquetasPorDia(prev => {
            const ausMap = { ...(prev[ausId] || {}) };
            const sel = ausMap[ds] || [];
            dias.forEach(d => { ausMap[d] = [...sel]; });
            return { ...prev, [ausId]: ausMap };
        });
    };
    const limpiarDia = (ausId: string, ds: string) => {
        setSeleccionEtiquetasPorDia(prev => {
            const ausMap = { ...(prev[ausId] || {}) };
            ausMap[ds] = [];
            return { ...prev, [ausId]: ausMap };
        });
    };

    const asignarCobertura = async (aus: AusenciaPendiente) => {
        const empSel = seleccionCubridor[aus.ausencia_id];
        const mapDia = seleccionEtiquetasPorDia[aus.ausencia_id] || {};
        const nota = (notaCobertura[aus.ausencia_id] || '').trim();
        if (!empSel) { showNotification('Selecciona un trabajador para cubrir', 'error'); return; }
        if (coberturaActiva(aus)) { showNotification('Ya hay una cobertura activa para esta ausencia', 'error'); return; }
        // Compactamos: solo dias con etiquetas
        const compact: Record<string, string[]> = {};
        Object.entries(mapDia).forEach(([d, ids]) => { if (ids.length > 0) compact[d] = ids; });
        setUpdatingId(aus.ausencia_id);
        try {
            const res = await fetch(`${API_BASE}/solicitudes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empleado_id: empSel,
                    creado_por: getLiderId(),
                    motivo: aus.motivo,
                    descripcion: nota || `Cobertura por ${aus.nombre_empleado}`,
                    fecha_inicio: aus.inicio_ausencia,
                    fecha_fin: aus.fin_ausencia,
                    ausencia_id: aus.ausencia_id,
                    etiquetas_cobertura: Object.keys(compact).length > 0 ? compact : null,
                })
            });
            if (res.ok) {
                setSeleccionCubridor(prev => ({ ...prev, [aus.ausencia_id]: '' }));
                setSeleccionEtiquetasPorDia(prev => ({ ...prev, [aus.ausencia_id]: {} }));
                setNotaCobertura(prev => ({ ...prev, [aus.ausencia_id]: '' }));
                showNotification('Cobertura solicitada, esperando confirmacion', 'success');
                fetchAll();
            } else {
                const d = await res.json().catch(() => ({}));
                showNotification(d.error || 'Error al solicitar cobertura', 'error');
            }
        } catch (err) { console.error('Error asignando cobertura:', err); showNotification('Error de conexion', 'error'); }
        setUpdatingId(null);
    };

    // Aprobar la ausencia: solo si hay cobertura aceptada.
    // Los turnos del cubridor ya fueron materializados por el backend al aceptar la cobertura,
    // asi que aqui solo cambiamos el estado de la ausencia.
    const aprobarAusencia = async (aus: AusenciaPendiente) => {
        const cob = coberturaActiva(aus);
        if (!cob || cob.estado !== 'aceptada') {
            showNotification('Necesitas una cobertura confirmada antes de aprobar', 'error');
            return;
        }
        setUpdatingId(aus.ausencia_id);
        try {
            const res = await fetch(`${API_BASE}/ausencias/${aus.ausencia_id}/estado`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado_id: 2, motivo_revision: null })
            });
            if (res.ok) {
                setAusenciasPendientes(prev => prev.filter(a => a.ausencia_id !== aus.ausencia_id));
                showNotification(`Ausencia aprobada. Turnos ya asignados a ${cob.nombre_asignado}`, 'success');
            } else {
                showNotification('Error al aprobar la ausencia', 'error');
            }
        } catch (err) { console.error('Error aprobando ausencia:', err); showNotification('Error de conexion al aprobar', 'error'); }
        setUpdatingId(null);
    };

    const rechazarAusencia = async (aus: AusenciaPendiente) => {
        setUpdatingId(aus.ausencia_id);
        try {
            const res = await fetch(`${API_BASE}/ausencias/${aus.ausencia_id}/estado`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado_id: 5, motivo_revision: 'Rechazada por el lider' })
            });
            if (res.ok) {
                setAusenciasPendientes(prev => prev.filter(a => a.ausencia_id !== aus.ausencia_id));
                showNotification(`${aus.motivo} de ${aus.nombre_empleado} rechazada`, 'error');
            } else {
                showNotification('Error al rechazar la ausencia', 'error');
            }
        } catch (err) { console.error('Error rechazando ausencia:', err); showNotification('Error de conexion al rechazar', 'error'); }
        setUpdatingId(null);
    };

    // Aprobar directamente
    const aprobarItem = async (item: PendingItem) => {
        setUpdatingId(item.id);
        try {
            const res = await fetch(getItemUrl(item), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado_id: 2, motivo_revision: null }) });
            if (res.ok) {
                setPendingItems(prev => prev.filter(p => p.id !== item.id));
                showNotification(`${tipoNombre(item.tipo)} de ${item.nombre_empleado} aprobada correctamente`, 'success');
            } else {
                showNotification('Error al aprobar la revision', 'error');
            }
        } catch (err) { console.error('Error aprobando:', err); showNotification('Error de conexion al aprobar', 'error'); }
        setUpdatingId(null);
    };

    // Solicitar correccion (estado 3) con motivo
    const enviarCorreccion = async () => {
        if (!rechazarItem || !motivoRevision.trim()) return;
        setUpdatingId(rechazarItem.id);
        try {
            const res = await fetch(getItemUrl(rechazarItem), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado_id: 3, motivo_revision: motivoRevision.trim() }) });
            if (res.ok) {
                setPendingItems(prev => prev.filter(p => p.id !== rechazarItem.id));
                showNotification(`Solicitud de correccion enviada a ${rechazarItem.nombre_empleado}`, 'error');
            } else {
                showNotification('Error al enviar la solicitud de correccion', 'error');
            }
        } catch (err) { console.error('Error rechazando:', err); showNotification('Error de conexion', 'error'); }
        setUpdatingId(null);
        setRechazarItem(null);
        setMotivoRevision('');
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        if (subFilter === 'todos') return pendingItems;
        const map: Record<string, string> = { planificacion: 'planificacion', horas: 'hora' };
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
    const countAus = ausenciasPendientes.length;
    const countCob = pendientesCob.length + rechazadasCob.length + countAus;

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
                                                                        {item.estado_id === 4 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/20">CORREGIDO</span>}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {formatDate(item.fecha)}
                                                                        {item.extra && <span className="ml-2 text-gray-500">· {item.extra}</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                                <button onClick={() => aprobarItem(item)} disabled={updatingId === item.id}
                                                                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                                                                    {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Aprobar
                                                                </button>
                                                                <button onClick={() => { setRechazarItem(item); setMotivoRevision(''); }} disabled={updatingId === item.id}
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
                            {ausenciasPendientes.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2"><CalendarOff className="w-4 h-4" /> Ausencias por aprobar — Requieren cobertura</h3>
                                    {ausenciasPendientes.map(aus => {
                                        const cobs = coberturasParaAusencia(aus);
                                        const activa = coberturaActiva(aus);
                                        const rechazadosIds = empleadosRechazaron(aus);
                                        const elegibles = empleados.filter(e =>
                                            e.empleado_id !== aus.empleado_id &&
                                            !rechazadosIds.includes(e.empleado_id) &&
                                            (!activa || activa.empleado_id !== e.empleado_id)
                                        );
                                        const puedeAprobar = activa?.estado === 'aceptada';
                                        const updating = updatingId === aus.ausencia_id;
                                        const dias = diasRango(aus.inicio_ausencia, aus.fin_ausencia);
                                        const seleccionDia = seleccionEtiquetasPorDia[aus.ausencia_id] || {};
                                        const totalChips = Object.values(seleccionDia).reduce((acc, l) => acc + l.length, 0);
                                        return (
                                            <div key={aus.ausencia_id} className="p-6 bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-rose-500/30">
                                                {/* Header de la ausencia */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-lg shrink-0">{aus.nombre_empleado.charAt(0)}</div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-lg font-bold text-white">{aus.motivo}</p>
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20">{aus.nombre_empleado}</span>
                                                                {aus.estado_id === 4 && <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/20">CORREGIDO</span>}
                                                            </div>
                                                            <p className="text-sm text-gray-400 mt-1">{formatDate(aus.inicio_ausencia)} al {formatDate(aus.fin_ausencia)} · {calcDias(aus.inicio_ausencia, aus.fin_ausencia)} dias</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => aprobarAusencia(aus)}
                                                            disabled={updating || !puedeAprobar}
                                                            title={puedeAprobar ? 'Aprobar y asignar turnos al cubridor' : 'Requiere cobertura confirmada'}
                                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Aprobar
                                                        </button>
                                                        <button onClick={() => rechazarAusencia(aus)} disabled={updating}
                                                            className="flex items-center gap-1 bg-red-600/80 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-50">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-5 border-t border-white/5">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Cobertura</p>

                                                    {/* Cobertura activa (pendiente o aceptada) */}
                                                    {activa && (
                                                        <div className="flex flex-col gap-2 mb-3 p-4 bg-black/20 rounded-xl border border-white/5">
                                                            <div className="flex items-center gap-3 text-sm">
                                                                <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs">{activa.nombre_asignado.charAt(0)}</span>
                                                                <span className="text-gray-200 font-bold">{activa.nombre_asignado}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ESTADO_COBERTURA_STYLES[activa.estado]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                                                                    {activa.estado === 'pendiente' ? 'Pendiente de confirmacion' : activa.estado === 'aceptada' ? 'Confirmado' : activa.estado}
                                                                </span>
                                                            </div>
                                                            {(() => {
                                                                const ec = activa.etiquetas_cobertura;
                                                                if (!ec) return null;
                                                                if (Array.isArray(ec) && ec.length > 0) {
                                                                    return (
                                                                        <div className="flex flex-wrap gap-1.5 ml-10">
                                                                            <span className="text-xs text-gray-500 mr-1 self-center">Todos los dias:</span>
                                                                            {ec.map(eid => {
                                                                                const etq = etiquetasCompartidas.find(e => e.etiqueta_id === eid);
                                                                                if (!etq) return null;
                                                                                return (
                                                                                    <span key={eid} className="flex items-center gap-1 text-xs bg-black/30 border border-white/10 rounded-md px-2 py-1">
                                                                                        <span className={`w-2.5 h-2.5 rounded-full ${etq.color}`}></span>
                                                                                        <span className="text-gray-200 font-bold">{etq.nombre}</span>
                                                                                        <span className="text-gray-500">{etq.rango_horas}</span>
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    );
                                                                }
                                                                if (typeof ec === 'object') {
                                                                    const map = ec as Record<string, string[]>;
                                                                    return (
                                                                        <div className="flex flex-col gap-1.5 ml-10">
                                                                            {dias.map(ds => {
                                                                                const ids = map[ds] || [];
                                                                                return (
                                                                                    <div key={ds} className="flex items-center gap-2 text-xs flex-wrap">
                                                                                        <span className="capitalize text-gray-300 font-bold w-44">{fmtDiaLabel(ds)}</span>
                                                                                        {ids.length === 0 ? (
                                                                                            <span className="text-gray-600 italic">sin cobertura</span>
                                                                                        ) : ids.map(eid => {
                                                                                            const etq = etiquetasCompartidas.find(e => e.etiqueta_id === eid);
                                                                                            if (!etq) return null;
                                                                                            return (
                                                                                                <span key={eid} className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-md px-2 py-0.5">
                                                                                                    <span className={`w-2 h-2 rounded-full ${etq.color}`}></span>
                                                                                                    <span className="text-gray-200">{etq.nombre}</span>
                                                                                                    <span className="text-gray-500">{etq.rango_horas}</span>
                                                                                                </span>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            {activa.descripcion && (
                                                                <p className="text-xs text-gray-400 ml-10 italic">&quot;{activa.descripcion}&quot;</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Historial de rechazos */}
                                                    {cobs.filter(c => c.estado === 'rechazada').length > 0 && (
                                                        <div className="flex flex-col gap-1 mb-3 p-3 bg-black/10 rounded-lg border border-white/5">
                                                            {cobs.filter(c => c.estado === 'rechazada').map(c => (
                                                                <div key={c.solicitud_id} className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                                                    <X className="w-3.5 h-3.5 text-red-400/70" />
                                                                    <span className="line-through">{c.nombre_asignado}</span>
                                                                    <span className="text-red-400/70 font-bold">Rechazado</span>
                                                                    {c.motivo_rechazo && <span className="italic">— &quot;{c.motivo_rechazo}&quot;</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Selector para asignar */}
                                                    {!activa && (
                                                        <div className="flex flex-col gap-4 mt-2">
                                                            <div className="flex items-center gap-3">
                                                                <select
                                                                    value={seleccionCubridor[aus.ausencia_id] || ''}
                                                                    onChange={e => setSeleccionCubridor(prev => ({ ...prev, [aus.ausencia_id]: e.target.value }))}
                                                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                                                >
                                                                    <option value="">{elegibles.length === 0 ? 'Sin trabajadores disponibles' : 'Seleccionar cubridor...'}</option>
                                                                    {elegibles.map(e => (<option key={e.empleado_id} value={e.empleado_id}>{e.nombre_empleado}</option>))}
                                                                </select>
                                                                <button
                                                                    onClick={() => asignarCobertura(aus)}
                                                                    disabled={updating || !seleccionCubridor[aus.ausencia_id]}
                                                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                                                    <UserPlus className="w-4 h-4" /> Asignar cobertura
                                                                </button>
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Horarios a cubrir por dia</p>
                                                                    <span className="text-[11px] text-gray-500">{totalChips} turno{totalChips !== 1 ? 's' : ''} seleccionado{totalChips !== 1 ? 's' : ''}</span>
                                                                </div>
                                                                {etiquetasCompartidas.length === 0 ? (
                                                                    <p className="text-xs text-amber-400/80 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">No hay horarios compartidos. Crea etiquetas en Catalogos &gt; Horarios para usarlas aqui.</p>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        {dias.map(ds => {
                                                                            const idsDia = seleccionDia[ds] || [];
                                                                            return (
                                                                                <div key={ds} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                                                                                    <div className="w-44 shrink-0">
                                                                                        <p className="text-sm font-bold text-white capitalize">{fmtDiaLabel(ds)}</p>
                                                                                        <button
                                                                                            onClick={() => aplicarDiaATodos(aus.ausencia_id, ds, dias)}
                                                                                            disabled={idsDia.length === 0}
                                                                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1 disabled:opacity-30 cursor-pointer">
                                                                                            Aplicar a todos los dias
                                                                                        </button>
                                                                                        {idsDia.length > 0 && (
                                                                                            <button
                                                                                                onClick={() => limpiarDia(aus.ausencia_id, ds)}
                                                                                                className="text-[10px] text-gray-500 hover:text-red-400 ml-2 cursor-pointer">
                                                                                                Limpiar
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-2 flex-1">
                                                                                        {etiquetasCompartidas.map(etq => {
                                                                                            const sel = idsDia.includes(etq.etiqueta_id);
                                                                                            return (
                                                                                                <button
                                                                                                    key={etq.etiqueta_id}
                                                                                                    onClick={() => toggleEtiquetaDia(aus.ausencia_id, ds, etq.etiqueta_id)}
                                                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${sel ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20' : 'bg-black/30 text-gray-300 border-white/10 hover:border-indigo-500/40 hover:bg-black/40'}`}
                                                                                                    title={`${etq.nombre} ${etq.rango_horas}`}
                                                                                                >
                                                                                                    <span className={`w-2.5 h-2.5 rounded-full ${etq.color}`}></span>
                                                                                                    {etq.nombre} <span className="opacity-70 font-normal">{etq.rango_horas}</span>
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5 block">Nota para el cubridor</label>
                                                                <textarea
                                                                    value={notaCobertura[aus.ausencia_id] || ''}
                                                                    onChange={e => setNotaCobertura(prev => ({ ...prev, [aus.ausencia_id]: e.target.value }))}
                                                                    placeholder={`Por defecto: "Cobertura por ${aus.nombre_empleado}"`}
                                                                    rows={2}
                                                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
                            {pendientesCob.length === 0 && rechazadasCob.length === 0 && ausenciasPendientes.length === 0 && (
                                <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-8 text-center">
                                    <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" /><p className="text-gray-400 text-sm">No hay coberturas pendientes</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== TAB: CREAR ========== */}
                    {activeTab === 'crear' && <CrearSolicitudTab empleados={empleados} onCreated={fetchAll} onNotify={showNotification} />}

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

            {reasignarSolicitud && <ModalReasignar solicitud={reasignarSolicitud} empleados={empleados} onClose={() => setReasignarSolicitud(null)} onDone={() => { setReasignarSolicitud(null); fetchAll(); showNotification('Solicitud reasignada correctamente', 'success'); }} />}

            {/* Modal solicitud de correccion */}
            {rechazarItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setRechazarItem(null)}>
                    <div className="bg-[#1e2336] rounded-2xl border border-[#3b4256] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                            <MessageSquare className="w-5 h-5 text-orange-400" />
                            Solicitar Correccion
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Indica al trabajador <strong className="text-white">{rechazarItem.nombre_empleado}</strong> que debe corregir este registro.
                            El trabajador podra ver tu comentario y reenviar la correccion.
                        </p>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Motivo de la correccion *</label>
                        <textarea value={motivoRevision} onChange={e => setMotivoRevision(e.target.value)}
                            placeholder="Ej: Las horas registradas no coinciden con el turno asignado..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-none h-24 mb-4" />
                        <div className="flex gap-2">
                            <button onClick={() => setRechazarItem(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={enviarCorreccion} disabled={!motivoRevision.trim() || updatingId === rechazarItem.id}
                                className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50">
                                {updatingId === rechazarItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                Enviar Correccion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificacion via portal para estar encima del header */}
            {notification && typeof document !== 'undefined' && createPortal(
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${notification.type === 'success'
                        ? 'bg-[#1a2e1f] border-emerald-500/40 text-emerald-400'
                        : 'bg-[#2e1a1a] border-red-500/40 text-red-400'
                        }`}>
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <p className="font-bold text-sm text-white pr-2">{notification.message}</p>
                        <button onClick={() => setNotification(null)} className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer ml-1">
                            <X className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
