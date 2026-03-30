'use client';

import { useRouter } from 'next/navigation';
import { API_BASE } from '@/app/lib/api';

interface HeaderProps {
    titulo?: string;
}

export default function Header({ titulo = 'Panel' }: HeaderProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            localStorage.removeItem('user_data');
            router.push('/Login');
        } catch (error) {
            console.error('Error al salir:', error);
        }
    };

    return (
        <header className="bg-gradient-to-r from-slate-900 to-slate-900/90 border-b border-gray-700/50 h-16 flex items-center justify-between px-6 shadow-lg z-50">
            <h2 className="text-gray-300 font-medium text-lg">{titulo}</h2>
            <button
                onClick={handleLogout}
                className="group flex items-center gap-2 bg-blue-500/10 hover:bg-red-500/10 text-blue-500 hover:text-red-500 border border-blue-500/20 hover:border-red-500/20 px-4 py-2 rounded-lg transition-all text-sm font-bold"
            >
                <span className="material-icons transition-transform group-hover:scale-110">
                    logout
                </span>
                Cerrar Sesión
            </button>
        </header>
    );
}
