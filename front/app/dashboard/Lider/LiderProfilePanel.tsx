'use client';
import { useState, useEffect } from 'react';
import ContentProfile from '../Trabajador/ContentProfile';

import { API_BASE } from '@/app/lib/api';

interface MenuItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    badges?: { count: number; color: string; label: string }[];
}

export default function LiderProfilePanel({ setVista, vistaActual }: { setVista: (vista: 'resume' | 'trabajadores' | 'proyectos' | 'catalogos' | 'solicitudes' | 'informe') => void; vistaActual: string }) {
    const [badgeTrabajadores, setBadgeTrabajadores] = useState(0);
    const [badgeSolicitudes, setBadgeSolicitudes] = useState(0);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const timestamp = Date.now();

                const [empleadosRes, ausenciasRes] = await Promise.all([
                    fetch(`${API_BASE}/empleados`),
                    fetch(`${API_BASE}/ausencias?t=${timestamp}`)
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
        <aside className="w-80 flex flex-col gap-6 h-full transition-all duration-300">

            {/* Datos del perfil (mismo componente que Trabajador) */}
            <ContentProfile />

            {/* Menú de navegación */}
            <nav className="flex flex-col gap-3">
                <MenuItem
                    icon="home"
                    label="Ver Resumen"
                    active={vistaActual === 'resume'}
                    onClick={() => setVista('resume')}
                />
                <MenuItem
                    icon="group"
                    label="Gestión Trabajadores"
                    active={vistaActual === 'trabajadores'}
                    onClick={() => setVista('trabajadores')}
                />
                <MenuItem
                    icon="work"
                    label="Proyectos y Equipos"
                    active={vistaActual === 'proyectos'}
                    onClick={() => setVista('proyectos')}
                />
                <MenuItem
                    icon="settings"
                    label="Catálogos"
                    active={vistaActual === 'catalogos'}
                    onClick={() => setVista('catalogos')}
                />
                <MenuItem
                    icon="assignment"
                    label="Solicitudes"
                    active={vistaActual === 'solicitudes'}
                    onClick={() => setVista('solicitudes')}
                />
                <MenuItem
                    icon="assessment"
                    label="Informes"
                    active={vistaActual === 'informe'}
                    onClick={() => setVista('informe')}
                />
            </nav>
        </aside>
    );
}

function MenuItem({ icon, label, onClick, active = false, badges = [] }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            className={`group flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-200 text-left
                ${active
                    ? 'bg-blue-600/20 border-blue-500/30 scale-[1.02]'
                    : 'bg-gray-800/40 border-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 hover:scale-105 hover:origin-right hover:z-50'
                }`}
        >
            <div className="flex items-center gap-3">
                <span className={`material-icons transition-colors ${active ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'}`}>
                    {icon}
                </span>
                <span className={`font-medium transition-colors ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {label}
                </span>
            </div>
            {badges.length > 0 && (
                <div className="flex items-center gap-1.5">
                    {badges.map((b, i) => (
                        <span
                            key={i}
                            title={b.label}
                            className={`${b.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg`}
                        >
                            {b.count}
                        </span>
                    ))}
                </div>
            )}
        </button>
    );
}
