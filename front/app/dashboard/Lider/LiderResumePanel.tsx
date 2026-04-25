'use client';
import { useState, useEffect } from 'react';
import { Users, Briefcase, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';

export default function LiderResumePanel() {
    const { user } = useUser();
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [totalTrabajadores, setTotalTrabajadores] = useState(0);
    const [totalProyectos, setTotalProyectos] = useState(0);
    const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
    const [solicitudesAprobadas, setSolicitudesAprobadas] = useState(0);
    const [totalHorasPendientes, setTotalHorasPendientes] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResumen = async () => {
            try {
                setIsLoading(true);
                if (user) {
                    setNombreUsuario(user.nombre_empleado?.split(' ')[0] || 'Líder');
                }

                const timestamp = Date.now();
                const [empleadosRes, proyectosRes, ausenciasRes, horasRes] = await Promise.all([
                    fetch(`${API_BASE}/empleados`),
                    fetch(`${API_BASE}/proyectos`),
                    fetch(`${API_BASE}/ausencias?t=${timestamp}`),
                    fetch(`${API_BASE}/hora?t=${timestamp}`),
                ]);

                if (empleadosRes.ok) {
                    const data = await empleadosRes.json();
                    setTotalTrabajadores(data.length);
                }
                if (proyectosRes.ok) {
                    const data = await proyectosRes.json();
                    setTotalProyectos(data.length);
                }
                if (ausenciasRes.ok) {
                    const data = await ausenciasRes.json();
                    if (Array.isArray(data)) {
                        setSolicitudesPendientes(data.filter((a: any) => a.estado_id === 1).length);
                        setSolicitudesAprobadas(data.filter((a: any) => a.estado_id === 2).length);
                    }
                }
                if (horasRes.ok) {
                    const data = await horasRes.json();
                    if (Array.isArray(data)) {
                        setTotalHorasPendientes(data.filter((h: any) => h.estado_id === 1).length);
                    }
                }
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
        { label: 'Trabajadores', val: totalTrabajadores, sub: 'registrados', color: 'var(--pr-primary)', bg: 'rgba(124,58,237,.06)', border: 'rgba(124,58,237,.3)', icon: <Users className="w-4 h-4" /> },
        { label: 'Proyectos', val: totalProyectos, sub: 'activos', color: 'var(--pr-cyan)', bg: 'rgba(6,182,212,.06)', border: 'rgba(6,182,212,.3)', icon: <Briefcase className="w-4 h-4" /> },
        { label: 'Pendientes', val: solicitudesPendientes, sub: totalHorasPendientes > 0 ? `+ ${totalHorasPendientes} horas` : 'solicitudes', color: 'var(--pr-warn)', bg: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.3)', icon: <AlertCircle className="w-4 h-4" /> },
        { label: 'Aprobadas', val: solicitudesAprobadas, sub: 'confirmadas', color: 'var(--pr-success)', bg: 'rgba(16,185,129,.06)', border: 'rgba(16,185,129,.3)', icon: <CheckCircle2 className="w-4 h-4" /> },
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
                    <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        ¡Hola, {nombreUsuario}!
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--pr-fgm)' }}>Aquí tienes el resumen general de tu equipo.</p>
                </div>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
                        style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                        <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                            style={{ background: `${s.color}20`, filter: 'blur(30px)' }}></div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                            style={{ background: `${s.color}20`, color: s.color }}>
                            {s.icon}
                        </div>
                        <div className="text-3xl font-extrabold mb-1"
                            style={{ color: s.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            {s.val}
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--pr-fgs)' }}>{s.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--pr-fgm)' }}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick summary */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--pr-bsub)' }}>
                    <Clock className="w-4 h-4" style={{ color: 'var(--pr-primary)' }} />
                    <h3 className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        Resumen Rápido
                    </h3>
                </div>
                <div className="p-5 flex flex-col gap-2">
                    {[
                        { icon: <Users className="w-4 h-4" style={{ color: 'var(--pr-primary)' }} />, label: 'Equipo total', val: `${totalTrabajadores} personas`, color: 'var(--pr-fg)' },
                        { icon: <Briefcase className="w-4 h-4" style={{ color: 'var(--pr-cyan)' }} />, label: 'Proyectos activos', val: `${totalProyectos} proyectos`, color: 'var(--pr-fg)' },
                        { icon: <AlertCircle className="w-4 h-4" style={{ color: 'var(--pr-warn)' }} />, label: 'Solicitudes por aprobar', val: `${solicitudesPendientes + totalHorasPendientes} pendientes`, color: 'var(--pr-warn)' },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: 'var(--pr-bg-deep)', border: '1px solid var(--pr-bsub)' }}>
                            <div className="flex items-center gap-3">
                                {row.icon}
                                <span className="text-sm" style={{ color: 'var(--pr-fgm)' }}>{row.label}</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: row.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{row.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
