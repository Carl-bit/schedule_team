'use client';

import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // 1. Avisar a la API para matar la cookie
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            // 2. Limpiar localStorage
            localStorage.removeItem('user_data');

            // 3. Redirigir al Login
            router.push('/Login');
        } catch (error) {
            console.error('Error al salir:', error);
        }
    };
    return (
        <header className="bg-gradient-to-r from-slate-900 to-slate-900/90 border-b border-gray-700/50 h-16 flex items-center justify-between px-6 shadow-lg z-50">
            {/* Título o Logo a la izquierda */}
            <h2 className="text-gray-300 font-medium text-lg">Bienvenido al Panel</h2>

            {/* Botón de Logout a la derecha */}
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