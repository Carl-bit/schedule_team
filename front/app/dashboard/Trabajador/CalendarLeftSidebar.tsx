'use client';
import { useEffect, useState } from 'react';
import { Tag, Layers, Plus, Undo2, Save, Clock } from 'lucide-react';
import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import { useActiveLabel, useHistoryHas, sendCalendarCommand } from './calendarStore';

interface Etiqueta {
    etiqueta_id: string;
    nombre: string;
    rango_horas: string;
    color: string;
    tipo: string;
    compartida?: boolean;
}

export default function CalendarLeftSidebar() {
    const { user } = useUser();
    const [labels, setLabels] = useState<Etiqueta[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeId, setActive] = useActiveLabel();
    const historyHas = useHistoryHas();

    useEffect(() => {
        if (!user?.empleado_id) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/etiquetas/${user.empleado_id}?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setLabels(data);
                }
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
        const onUpdate = () => load();
        window.addEventListener('scheduleUpdated', onUpdate);
        return () => window.removeEventListener('scheduleUpdated', onUpdate);
    }, [user?.empleado_id]);

    const ownReg = labels.filter(l => l.tipo !== 'pattern' && !l.compartida);
    const sharedReg = labels.filter(l => l.tipo !== 'pattern' && l.compartida);
    const patterns = labels.filter(l => l.tipo === 'pattern');

    const renderItem = (l: Etiqueta) => {
        const isActive = activeId === l.etiqueta_id;
        const isPattern = l.tipo === 'pattern';
        return (
            <button
                key={l.etiqueta_id}
                onClick={() => setActive(isActive ? null : l.etiqueta_id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${isActive
                    ? 'border-white/20 bg-black/40 ring-1 ring-white/10 shadow-[0_0_12px_rgba(124,58,237,0.18)]'
                    : 'border-gray-800/80 bg-black/20 hover:border-gray-600 hover:bg-gray-800/40'
                    }`}
            >
                {isPattern ? (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${l.color} shadow-inner`}>
                        <Layers className="w-3.5 h-3.5 text-white" />
                    </div>
                ) : (
                    <span className={`w-3 h-3 rounded-full shadow-sm shrink-0 ${l.color}`} />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{l.nombre}</span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                        <Clock className="w-3 h-3 opacity-70 shrink-0" /> {l.rango_horas}
                    </span>
                </div>
            </button>
        );
    };

    return (
        <aside className="w-full h-full flex flex-col overflow-hidden"
            style={{ background: 'var(--pr-bg-deep)', borderRight: '1px solid var(--pr-bsub)' }}>

            {/* Header con boton Crear */}
            <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--pr-bsub)' }}>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] flex items-center gap-2 mb-3"
                    style={{ color: 'var(--pr-fgs)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    <Tag className="w-4 h-4" /> Filtros del calendario
                </p>
                <button
                    onClick={() => sendCalendarCommand('create')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                    style={{ background: 'var(--pr-primary)', boxShadow: '0 0 16px rgba(124,58,237,0.25)' }}
                >
                    <Plus className="w-4 h-4" /> Nueva etiqueta / patrón
                </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col gap-5">
                {loading && <div className="text-xs text-gray-500 italic">Cargando...</div>}

                {/* Compartidas (lider) */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-extrabold mb-2 flex items-center gap-2"
                        style={{ color: 'var(--pr-warn)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <Layers className="w-3 h-3" /> Horarios del líder
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">solo lectura</span>
                    </p>
                    {sharedReg.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Aún no hay horarios compartidos.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5">{sharedReg.map(renderItem)}</div>
                    )}
                </div>

                {/* Mias */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-extrabold mb-2 flex items-center gap-2"
                        style={{ color: 'var(--pr-primary)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <Tag className="w-3 h-3" /> Mis etiquetas
                    </p>
                    {ownReg.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Sin etiquetas propias.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5">{ownReg.map(renderItem)}</div>
                    )}
                </div>

                {/* Patrones */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-extrabold mb-2 flex items-center gap-2"
                        style={{ color: 'var(--pr-cyan)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <Layers className="w-3 h-3" /> Patrones
                    </p>
                    {patterns.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Sin patrones.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5">{patterns.map(renderItem)}</div>
                    )}
                </div>
            </div>

            {/* Footer con Deshacer / Guardar */}
            <div className="px-4 py-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid var(--pr-bsub)', background: 'var(--pr-bg-deep)' }}>
                <button
                    onClick={() => sendCalendarCommand('undo')}
                    disabled={!historyHas}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:cursor-not-allowed cursor-pointer"
                    style={{
                        background: 'transparent',
                        border: `1px solid ${historyHas ? 'var(--pr-border)' : 'var(--pr-bsub)'}`,
                        color: historyHas ? 'var(--pr-fgm)' : 'var(--pr-fgs)',
                    }}
                >
                    <Undo2 className="w-4 h-4" /> Deshacer
                </button>
                <button
                    onClick={() => sendCalendarCommand('save')}
                    disabled={!historyHas}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:cursor-not-allowed cursor-pointer"
                    style={{
                        background: historyHas ? 'var(--pr-primary)' : 'var(--pr-bg-card)',
                        color: historyHas ? '#fff' : 'var(--pr-fgs)',
                        boxShadow: historyHas ? '0 0 12px rgba(124,58,237,0.25)' : 'none',
                        border: 'none',
                    }}
                >
                    <Save className="w-4 h-4" /> Guardar
                </button>
            </div>
        </aside>
    );
}
