'use client';
import { useState, useEffect } from 'react';
import ContentProfile from './ContentProfile';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';

interface MenuItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    badges?: { count: number; bg: string; color: string; label: string }[];
}

export default function ProfilePanel({ setVista }: { setVista: (vista: 'calendar' | 'equipos' | 'solicitudes' | 'resume') => void }) {
    const { user } = useUser();
    const [activeView, setActiveView] = useState<string>('resume');
    const [badgeEquipos, setBadgeEquipos] = useState(0);
    const [badgeHoras, setBadgeHoras] = useState(0);
    const [badgeAusencias, setBadgeAusencias] = useState(0);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                if (!user) return;
                const userId = user.empleado_id;
                const timestamp = Date.now();

                const [asignacionesRes, planRes, horasRes, ausenciasRes] = await Promise.all([
                    fetch(`${API_BASE}/asignaciones`),
                    fetch(`${API_BASE}/planificacion/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/hora/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/ausencias/${userId}?t=${timestamp}`)
                ]);

                if (asignacionesRes.ok) {
                    const data = await asignacionesRes.json();
                    const proyectos = new Set<string>();
                    data.forEach((item: any) => {
                        if (item.empleado_id === userId) proyectos.add(item.proyecto_id);
                    });
                    setBadgeEquipos(proyectos.size);
                }

                let horasPend = 0;
                if (planRes.ok) {
                    const planData = await planRes.json();
                    horasPend += planData.filter((p: any) => p.estado_id === 1).length;
                }
                if (horasRes.ok) {
                    const horasData = await horasRes.json();
                    horasPend += horasData.filter((h: any) => h.estado_id === 1).length;
                }
                setBadgeHoras(horasPend);

                if (ausenciasRes.ok) {
                    const ausData = await ausenciasRes.json();
                    if (Array.isArray(ausData)) {
                        const ausPend = ausData.filter((a: any) => a.requiere_aprobacion && a.estado_id === 1).length;
                        setBadgeAusencias(ausPend);
                    }
                }
            } catch (err) {
                console.error('Error cargando badges:', err);
            }
        };

        fetchBadges();
    }, [user]);

    const handleClick = (v: 'calendar' | 'equipos' | 'solicitudes' | 'resume') => {
        setVista(v);
        setActiveView(v);
    };

    return (
        <aside className="flex flex-col h-full overflow-hidden"
            style={{ background: 'var(--pr-bg-deep)', borderLeft: '1px solid var(--pr-bsub)' }}>
            <ContentProfile />

            <nav className="py-2 flex-1 overflow-y-auto custom-scrollbar">
                <MenuItem
                    icon="🏠"
                    label="Ver Resumen"
                    active={activeView === 'resume'}
                    onClick={() => handleClick('resume')}
                />
                <MenuItem
                    icon="👥"
                    label="Ver Equipos"
                    active={activeView === 'equipos'}
                    onClick={() => handleClick('equipos')}
                    badges={badgeEquipos > 0 ? [{ count: badgeEquipos, bg: 'rgba(124,58,237,0.2)', color: 'var(--pr-primary)', label: 'equipos' }] : []}
                />
                <MenuItem
                    icon="📅"
                    label="Ver Calendario"
                    active={activeView === 'calendar'}
                    onClick={() => handleClick('calendar')}
                />
                <MenuItem
                    icon="🔔"
                    label="Ver Solicitudes"
                    active={activeView === 'solicitudes'}
                    onClick={() => handleClick('solicitudes')}
                    badges={[
                        ...(badgeHoras > 0 ? [{ count: badgeHoras, bg: 'rgba(245,158,11,0.2)', color: 'var(--pr-warn)', label: 'horas' }] : []),
                        ...(badgeAusencias > 0 ? [{ count: badgeAusencias, bg: 'rgba(239,68,68,0.2)', color: 'var(--pr-red)', label: 'ausencias' }] : [])
                    ]}
                />
            </nav>
        </aside>
    );
}

function MenuItem({ icon, label, onClick, active = false, badges = [] }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full px-5 py-4 text-left transition-colors text-base font-semibold border-none cursor-pointer"
            style={{
                background: active ? 'rgba(124,58,237,0.14)' : 'transparent',
                color: active ? 'var(--pr-primary)' : 'var(--pr-fgm)',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                    e.currentTarget.style.color = 'var(--pr-fg)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--pr-fgm)';
                }
            }}
        >
            <span className="w-5 text-center text-base flex-shrink-0">{icon}</span>
            <span className="flex-1">{label}</span>
            {badges.length > 0 && (
                <span className="flex items-center gap-1.5">
                    {badges.map((b, i) => (
                        <span
                            key={i}
                            title={b.label}
                            className="text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                            style={{ background: b.bg, color: b.color }}
                        >
                            {b.count}
                        </span>
                    ))}
                </span>
            )}
        </button>
    );
}
