'use client';
// 1. Importamos el componente que acabamos de crear
import ContentProfile from './ContentProfile';

interface MenuItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    badge?: number;
}

export default function ProfilePanel({ setVista }: { setVista: (vista: 'calendar' | 'equipos' | 'solicitudes' | 'resume') => void }) {


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
                    badge={2}
                />
            </nav>

        </aside>
    );
}

// El componente MenuItem se queda aquí o puedes moverlo a /components/UI si quieres reutilizarlo en otros lados
function MenuItem({ icon, label, onClick, badge = 0 }: MenuItemProps) {
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
            {badge > 0 && (
                <span className="bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-pink-500/20 animate-pulse">
                    {badge}
                </span>
            )}
        </button>
    );
}