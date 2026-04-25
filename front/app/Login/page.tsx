'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/app/lib/api';

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ correo: email, password: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            localStorage.setItem('user_data', JSON.stringify(data.user));
            console.log('Login exitoso:', data.mensaje);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--pr-bg)', color: 'var(--pr-fg)' }}>
            {/* Glow background */}
            <div className="absolute pointer-events-none" style={{
                top: '20%', left: '50%', transform: 'translateX(-50%)',
                width: 700, height: 500,
                background: 'radial-gradient(ellipse at center, rgba(124,58,237,.18) 0%, transparent 70%)'
            }}></div>
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(46,54,80,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(46,54,80,0.3) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
                maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
            }}></div>

            <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-8 backdrop-blur-md"
                style={{ background: 'rgba(28,33,56,0.85)', border: '1px solid var(--pr-border)', boxShadow: '0 40px 100px rgba(0,0,0,.6)' }}>

                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-xl mb-6"
                        style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--pr-primary)', boxShadow: '0 0 10px var(--pr-primary)' }}></span>
                        Schedule
                    </Link>
                    <h1 className="text-2xl font-extrabold mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--pr-fgm)' }}>Sistema de Gestión de Equipos</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--pr-fgs)' }}>
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                            style={{ background: 'var(--pr-bg-deep)', border: '1px solid var(--pr-border)', color: 'var(--pr-fg)' }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pr-primary)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--pr-border)')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--pr-fgs)' }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                            style={{ background: 'var(--pr-bg-deep)', border: '1px solid var(--pr-border)', color: 'var(--pr-fg)' }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pr-primary)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--pr-border)')}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl text-sm text-center"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--pr-red)' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        style={{
                            background: loading ? 'var(--pr-bg-card2)' : 'var(--pr-primary)',
                            boxShadow: loading ? 'none' : '0 0 30px rgba(124,58,237,.3)',
                            fontFamily: "'Plus Jakarta Sans',sans-serif"
                        }}
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 pt-6 text-xs text-center" style={{ borderTop: '1px solid var(--pr-bsub)', color: 'var(--pr-fgs)' }}>
                    <p>Credenciales de prueba:</p>
                    <div className="mt-2 space-y-1">
                        <p>Líder: <span style={{ color: 'var(--pr-primary)' }}>carlos@empresa.com</span> / admin123</p>
                        <p>Trabajador: <span style={{ color: 'var(--pr-success)' }}>ana@empresa.com</span> / ana123</p>
                    </div>
                </div>

                <Link href="/" className="block text-center mt-6 text-xs hover:text-white transition-colors" style={{ color: 'var(--pr-fgm)' }}>
                    ← Volver al inicio
                </Link>
            </div>
        </div>
    );
}
