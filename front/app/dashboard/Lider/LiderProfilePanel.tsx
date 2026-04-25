'use client';
import { useState, useEffect } from 'react';
import ContentProfile from '../Trabajador/ContentProfile';

import { API_BASE } from '@/app/lib/api';

interface MenuItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    badges?: { count: number; bg: string; color: string; label: string }[];
}

export default function LiderProfilePanel({ setVista, vistaActual }: { setVista: (vista: 'resume' | 'trabajadores' | 'proyectos' | 'catalogos' | 'solicitudes' | 'informe') => void; vistaActual: string }) {
    const [, setBadgeTrabajadores] = useState(0);
    const [badgeSolicitudes, setBadgeSolicitudes] = useState(0);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const timestamp = Date.now();

                const [empleadosRes, ausenciasRes] = await Promise.all([
                    fetch(`${API_BASE}/empleados`),
                    fetch(`${API_BASE}/ausencias?t=${timestamp}`),
                ]);

                if (empleadosRes.ok) {
                    const data = await empleadosRes.json();
                    setBadgeTrabajadores(data.length);
                }

                if (ausenciasRes.ok) {
                    const data = await ausenciasRes.json();
                    if (Array.isArray(data)) {
                        const pendientes = data.filter((a: any) => a.estado_id === 1).length;
                        setBadgeSolicitudes(pendientes);
                    }
                }
            } catch (err) {
                console.error('Error cargando badges:', err);
            }
        };

        fetchBadges();
    }, []);

    return (
        <aside className="flex flex-col h-full overflow-hidden"
            style={{ background: 'var(--pr-bg-deep)', borderLeft: '1px solid var(--pr-bsub)' }}>
            <ContentProfile />

            <nav className="py-2 flex-1 overflow-y-auto custom-scrollbar">
                <MenuItem icon="🏠" label="Ver Resumen" active={vistaActual === 'resume'} onClick={() => setVista('resume')} />
                <MenuItem icon="👥" label="Trabajadores" active={vistaActual === 'trabajadores'} onClick={() => setVista('trabajadores')} />
                <MenuItem icon="📁" label="Proyectos" active={vistaActual === 'proyectos'} onClick={() => setVista('proyectos')} />
                <MenuItem icon="⚙️" label="Catálogos" active={vistaActual === 'catalogos'} onClick={() => setVista('catalogos')} />
                <MenuItem
                    icon="📝"
                    label="Solicitudes"
                    active={vistaActual === 'solicitudes'}
                    onClick={() => setVista('solicitudes')}
                    badges={badgeSolicitudes > 0 ? [{ count: badgeSolicitudes, bg: 'rgba(245,158,11,0.2)', color: 'var(--pr-warn)', label: 'pendientes' }] : []}
                />
                <MenuItem icon="📊" label="Informes" active={vistaActual === 'informe'} onClick={() => setVista('informe')} />
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
