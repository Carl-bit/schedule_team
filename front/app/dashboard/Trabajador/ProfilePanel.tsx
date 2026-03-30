'use client';
import { useState, useEffect } from 'react';
import ContentProfile from './ContentProfile';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';

interface MenuItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    badges?: { count: number; color: string; label: string }[];
}

export default function ProfilePanel({ setVista }: { setVista: (vista: 'calendar' | 'equipos' | 'solicitudes' | 'resume') => void }) {
    const { user } = useUser();
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

                // Equipos
                if (asignacionesRes.ok) {
                    const data = await asignacionesRes.json();
                    const proyectos = new Set<string>();
                    data.forEach((item: any) => {
                        if (item.empleado_id === userId) proyectos.add(item.proyecto_id);
                    });
                    setBadgeEquipos(proyectos.size);
                }

                // Horas pendientes
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

                // Ausencias pendientes
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

    return (
        <aside className="w-80 flex flex-col gap-6 h-full transition-all duration-300">

            {/* 2. Aquí insertamos el componente hijo */}
            <ContentProfile />

            {/* 3. El menú se queda aquí porque es parte de la navegación del panel */}
            <nav className="flex flex-col gap-3">
                <MenuItem
                    icon="home"
                    label="Ver Resumen"
                    onClick={() => setVista('resume')}
                />
                <MenuItem
                    icon="group"
                    label="Ver Equipos"
                    onClick={() => setVista('equipos')}
                />

                <MenuItem
                    icon="calendar_month"
                    label="Ver Calendario"
                    onClick={() => setVista('calendar')}
                />

                <MenuItem
                    icon="notifications"
                    label="Ver Solicitudes"
                    onClick={() => setVista('solicitudes')}
                    badges={[
                        ...(badgeEquipos > 0 ? [{ count: badgeEquipos, color: 'bg-indigo-500 shadow-indigo-500/30', label: 'equipos' }] : []),
                        ...(badgeHoras > 0 ? [{ count: badgeHoras, color: 'bg-amber-500 shadow-amber-500/30', label: 'horas' }] : []),
                        ...(badgeAusencias > 0 ? [{ count: badgeAusencias, color: 'bg-rose-500 shadow-rose-500/30', label: 'ausencias' }] : [])
                    ]}
                />
            </nav>

        </aside>
    );
}

// El componente MenuItem se queda aquí o puedes moverlo a /components/UI si quieres reutilizarlo en otros lados
function MenuItem({ icon, label, onClick, badges = [] }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center justify-between w-full p-4 rounded-xl bg-gray-800/40 border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 hover:scale-105 hover:origin-right hover:z-50 transition-all duration-200 text-left"
        >
            <div className="flex items-center gap-3">
                <span className="material-icons text-gray-400 group-hover:text-cyan-400 transition-colors">
                    {icon}
                </span>
                <span className="text-gray-300 font-medium group-hover:text-white transition-colors">
                    {label}
                </span>
            </div>
            {badges.length > 0 && (
                <div className="flex items-center gap-1.5">
                    {badges.map((b, i) => (
                        <span
                            key={i}
                            title={b.label}
                            className={`${b.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse`}
                        >
                            {b.count}
                        </span>
                    ))}
                </div>
            )}
        </button>
    );
}