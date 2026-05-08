'use client';
import { useState, useEffect, useCallback } from 'react';
import { Settings, Briefcase, Shield, AlertTriangle, Plus, Pencil, Trash2, X, Check, Loader2, Clock } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import type { EtiquetaHorario } from '@/app/types';
import TimePicker from '@/app/components/UI/TimePicker';
import { notifySuccess, notifyError } from '@/app/hooks/useNotify';

type TabType = 'puestos' | 'roles' | 'estados' | 'ausencias' | 'horarios';

interface CatItem { id: string; nombre: string; extra?: boolean; }
const COLORS = ['bg-teal-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-rose-500'];

export default function CatalogosPanel() {
    const [activeTab, setActiveTab] = useState<TabType>('puestos');
    const [items, setItems] = useState<CatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState('');
    const [editValue, setEditValue] = useState('');
    const [error, setError] = useState('');

    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'puestos', label: 'Puestos', icon: <Briefcase className="w-4 h-4" /> },
        { key: 'roles', label: 'Roles', icon: <Shield className="w-4 h-4" /> },
        { key: 'estados', label: 'Estados', icon: <AlertTriangle className="w-4 h-4" /> },
        { key: 'ausencias', label: 'Ausencias', icon: <Settings className="w-4 h-4" /> },
        { key: 'horarios', label: 'Horarios', icon: <Clock className="w-4 h-4" /> },
    ];

    const fetchData = useCallback(async () => {
        if (activeTab === 'horarios') { setLoading(false); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/catalogos/${activeTab}`);
            const data = await res.json();
            if (!Array.isArray(data)) { setItems([]); setLoading(false); return; }

            const mapped: CatItem[] = data.map((d: any) => {
                switch (activeTab) {
                    case 'puestos': return { id: d.puesto_empleado_id, nombre: d.puesto_empleado };
                    case 'roles': return { id: d.rol_trabajo_id, nombre: d.rol_trabajo };
                    case 'estados': return { id: String(d.estado_id), nombre: d.estado };
                    case 'ausencias': return { id: d.tipo_id, nombre: d.descripcion, extra: d.requiere_aprobacion };
                    default: return { id: '', nombre: '' };
                }
            });
            setItems(mapped);
        } catch { setError('Error al cargar'); }
        setLoading(false);
    }, [activeTab]);

    useEffect(() => { fetchData(); setNewName(''); setEditId(''); }, [activeTab, fetchData]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setError('');
        try {
            const bodyMap: Partial<Record<TabType, object>> = {
                puestos: { nombre: newName },
                roles: { rol_trabajo: newName },
                estados: { estado: newName },
                ausencias: { descripcion: newName, requiere_aprobacion: true },
            };
            const res = await fetch(`${API_BASE}/catalogos/${activeTab}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyMap[activeTab]),
            });
            if (res.ok) { setNewName(''); fetchData(); notifySuccess(`${activeTab.slice(0, -1)} creado correctamente`); }
            else {
                const d = await res.json().catch(() => ({}));
                const msg = d.error || 'Error al crear';
                setError(msg); notifyError(msg);
            }
        } catch { setError('Error de conexión'); notifyError('Error de conexion'); }
    };

    const handleUpdate = async (id: string) => {
        if (!editValue.trim()) return;
        setError('');
        try {
            const bodyMap: Partial<Record<TabType, object>> = {
                puestos: { nombre: editValue },
                roles: { rol_trabajo: editValue },
                estados: { estado: editValue },
                ausencias: { descripcion: editValue },
            };
            const res = await fetch(`${API_BASE}/catalogos/${activeTab}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyMap[activeTab]),
            });
            if (res.ok) { setEditId(''); setEditValue(''); fetchData(); notifySuccess('Cambios guardados'); }
            else {
                const d = await res.json().catch(() => ({}));
                const msg = d.error || 'Error al actualizar';
                setError(msg); notifyError(msg);
            }
        } catch { setError('Error de conexión'); notifyError('Error de conexion'); }
    };

    const handleDelete = async (id: string) => {
        setError('');
        try {
            const res = await fetch(`${API_BASE}/catalogos/${activeTab}/${id}`, { method: 'DELETE' });
            if (res.ok) { fetchData(); notifySuccess('Eliminado correctamente'); }
            else {
                const d = await res.json().catch(() => ({}));
                const msg = d.error || 'Error al eliminar';
                setError(msg); notifyError(msg);
            }
        } catch { setError('Error de conexión'); notifyError('Error de conexion'); }
    };

    return (
        <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-violet-400" />
                    Catálogos
                </h2>
                <p className="text-gray-300 text-sm mt-1">Gestiona los puestos, roles, estados y tipos de ausencia</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
                            ${activeTab === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'bg-[#1e2336]/80 text-gray-400 hover:text-white hover:bg-[#2a3050]/80 border border-[#3b4256]/50'
                            }`}>
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content card */}
            {activeTab === 'horarios' ? (
                <HorariosCompartidos onError={setError} />
            ) : (
            <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-5">
                {/* Add new */}
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={`Nuevo ${activeTab.slice(0, -1)}...`}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    <button onClick={handleCreate}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer">
                        <Plus className="w-4 h-4" /> Agregar
                    </button>
                </div>

                {error && <div className="p-2 mb-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs text-center">{error}</div>}

                {/* Items list */}
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
                ) : items.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No hay elementos en este catálogo</p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                                {editId === item.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                                            onKeyDown={e => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') setEditId(''); }}
                                            className="flex-1 bg-gray-900 border border-indigo-500 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none" />
                                        <button onClick={() => handleUpdate(item.id)} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => setEditId('')} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-gray-600 font-mono bg-gray-800/50 px-1.5 py-0.5 rounded">{item.id}</span>
                                            <span className="text-sm text-white font-medium">{item.nombre}</span>
                                            {item.extra !== undefined && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.extra ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {item.extra ? 'Req. aprobación' : 'Auto-aprobado'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditId(item.id); setEditValue(item.nombre); }}
                                                className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 transition-colors cursor-pointer">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}
        </div>
    );
}

// Sub-vista: gestion de etiquetas de horario compartidas
function HorariosCompartidos({ onError }: { onError: (msg: string) => void }) {
    const { user } = useUser();
    const [items, setItems] = useState<EtiquetaHorario[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<EtiquetaHorario | null>(null);
    const [form, setForm] = useState({ nombre: '', inicio: '08:00', fin: '17:00', color: COLORS[0] });

    const reset = () => { setEditing(null); setForm({ nombre: '', inicio: '08:00', fin: '17:00', color: COLORS[0] }); };

    const fetchHorarios = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/etiquetas/compartidas`);
            const data = await res.json();
            if (Array.isArray(data)) setItems(data);
        } catch { onError('Error al cargar horarios'); }
        setLoading(false);
    };

    useEffect(() => { fetchHorarios(); }, []);

    const guardar = async () => {
        if (!form.nombre.trim()) { onError('Falta el nombre'); return; }
        if (!user?.empleado_id) { onError('Sesion no detectada'); return; }
        if (!/^\d{2}:\d{2}$/.test(form.inicio) || !/^\d{2}:\d{2}$/.test(form.fin)) {
            onError('Horarios invalidos (usa HH:MM)'); return;
        }
        const rango_horas = `${form.inicio} - ${form.fin}`;
        const payload = {
            etiqueta_id: editing ? editing.etiqueta_id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `etq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
            empleado_id: user.empleado_id,
            nombre: form.nombre.trim(),
            rango_horas,
            color: form.color,
            tipo: 'work',
            secuencia_patron: null,
            compartida: true,
        };
        const url = editing ? `${API_BASE}/etiquetas/${editing.etiqueta_id}` : `${API_BASE}/etiquetas`;
        const method = editing ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { reset(); fetchHorarios(); notifySuccess(editing ? 'Horario actualizado' : 'Horario creado'); return; }
            let msg = `HTTP ${res.status}`;
            try {
                const d = await res.json();
                if (d?.error) msg = d.error;
            } catch { /* respuesta no JSON */ }
            console.error('Error al guardar horario compartido', { status: res.status, msg, payload });
            onError(`Error al guardar: ${msg}`);
            notifyError(`Error al guardar: ${msg}`);
        } catch (err) { console.error('Error de red al guardar horario:', err); onError('Error de conexion'); notifyError('Error de conexion'); }
    };

    const eliminar = async (etq: EtiquetaHorario) => {
        if (!confirm(`Eliminar el horario "${etq.nombre}"?`)) return;
        try {
            const res = await fetch(`${API_BASE}/etiquetas/${etq.etiqueta_id}`, { method: 'DELETE' });
            if (res.ok) { fetchHorarios(); notifySuccess(`Horario "${etq.nombre}" eliminado`); }
            else {
                const d = await res.json().catch(() => ({}));
                const msg = d.error || 'Error al eliminar';
                onError(msg); notifyError(msg);
            }
        } catch { onError('Error de conexion'); notifyError('Error de conexion'); }
    };

    const editar = (etq: EtiquetaHorario) => {
        const m = etq.rango_horas.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        setEditing(etq);
        setForm({ nombre: etq.nombre, inicio: m ? m[1] : '08:00', fin: m ? m[2] : '17:00', color: etq.color });
    };

    return (
        <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-5">
            <p className="text-xs text-gray-400 mb-3">Horarios que todos los trabajadores comparten. Se usan para asignar coberturas (turnos del cubridor).</p>

            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 mb-4 items-end">
                <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Nombre</label>
                    <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Turno mañana"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Inicio</label>
                    <TimePicker value={form.inicio} onChange={v => setForm({ ...form, inicio: v })} />
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Fin</label>
                    <TimePicker value={form.fin} onChange={v => setForm({ ...form, fin: v })} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-bold">Color</label>
                    <div className="flex gap-1">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => setForm({ ...form, color: c })} title={c}
                                className={`w-6 h-6 rounded-full ${c} ${form.color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'} transition-all cursor-pointer`} />
                        ))}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={guardar}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer">
                        {editing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editing ? 'Guardar' : 'Crear'}
                    </button>
                    {editing && (
                        <button onClick={reset} className="px-3 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white text-sm cursor-pointer">Cancelar</button>
                    )}
                </div>
            </div>

            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div> : items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Aun no hay horarios compartidos</p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {items.map(etq => (
                        <div key={etq.etiqueta_id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${etq.color}`}></span>
                                <span className="text-sm text-white font-bold">{etq.nombre}</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{etq.rango_horas}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => editar(etq)} className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => eliminar(etq)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
