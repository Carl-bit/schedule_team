'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';

interface HeaderProps {
    titulo?: string;
    empresa?: string;
}

export default function Header({ titulo = 'Panel', empresa = 'Empresa Demo' }: HeaderProps) {
    const router = useRouter();
    const { user } = useUser();

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

    const fechaHoy = new Date().toLocaleDateString('es-ES', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const alias = user?.alias_empleado || user?.nombre_empleado?.split(' ')[0] || 'Usuario';

    return (
        <header
            className="h-20 flex items-center justify-between px-8 z-50 flex-shrink-0"
            style={{
                background: 'var(--pr-bg-deep)',
                borderBottom: '1px solid var(--pr-bsub)',
            }}
        >
            {/* Left: logo + empresa */}
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-extrabold text-base"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: 'var(--pr-fg)' }}
                >
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--pr-primary)', boxShadow: '0 0 8px var(--pr-primary)' }}
                    ></span>
                    Schedule
                </Link>
                <div className="h-5 w-px" style={{ background: 'var(--pr-bsub)' }}></div>
                <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                        background: 'var(--pr-bsub)',
                        color: 'var(--pr-fgm)',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                >
                    {empresa}
                </span>
            </div>

            {/* Center: titulo */}
            

            {/* Right: fecha + alias + logout */}
            <div className="flex items-center gap-5">
                <span
                    className="hidden md:block text-sm"
                    style={{ color: 'var(--pr-fgs)' }}
                >
                    {fechaHoy}
                </span>
                <div className="h-6 w-px hidden md:block" style={{ background: 'var(--pr-bsub)' }}></div>
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                        style={{ background: 'var(--pr-primary)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                    >
                        {alias.charAt(0).toUpperCase()}
                    </div>
                    <span
                        className="text-base font-semibold"
                        style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                    >
                        {alias}
                    </span>
                </div>
                {/* spacer between user and logout */}
                <div className="w-8" />
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:text-white"
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--pr-border)',
                        color: 'var(--pr-fgm)',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--pr-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--pr-border)')}
                >
                    <span className="material-icons" style={{ fontSize: 16 }}>logout</span>
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );
}
