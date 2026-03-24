'use client'; // Importante: Esto corre en el navegador

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Square from '../components/Backgrounds/Square';

export default function LoginPage() {
    const router = useRouter();

    // Estados para guardar lo que escribe el usuario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Evita que la página se recargue sola
        setLoading(true);
        setError('');

        try {
            // 1. Llamamos a TU API (La que probaste en Insomnia)
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 🚨 VITAL: Esto permite que el navegador guarde la Cookie que envía el servidor
                credentials: 'include',
                body: JSON.stringify({
                    correo: email,     // Usamos los nombres exactos que espera tu backend
                    password: password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            localStorage.setItem('user_data', JSON.stringify(data.user));
            // 2. Si todo sale bien...
            // No necesitamos leer la cookie aquí manualmente. El navegador ya la guardó.
            // Simplemente empujamos al usuario al Dashboard.
            console.log('Login exitoso:', data.mensaje);

            // El Middleware interceptará esto y decidirá si va a /Lider o /Trabajador
            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gray-900 text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Square
                    direction="diagonal"
                    speed={0.3}
                    borderColor="#1e3a8aff"
                    hoverFillColor="#06b6d4"
                    squareSize={63}
                />
            </div>

            <div className="relative z-10 w-full max-w-md bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-700">

                {/* Header del Login */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        👤
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Schedule Test</h1>
                    <p className="text-gray-400">Sistema de Registro de Horas</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleLogin} className="space-y-6">

                    {/* Input Usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Input Contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Mensaje de Error (Si existe) */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Botón de Acción */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all
              ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-[1.02]'
                            }`}
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>

                </form>

                {/* Ayuda visual para pruebas (Puedes borrar esto luego) */}
                <div className="mt-8 pt-6 border-t border-gray-700 text-xs text-gray-500 text-center">
                    <p>Credenciales de prueba:</p>
                    <div className="mt-2 space-y-1">
                        <p>Jefe: <span className="text-blue-400">carlos@empresa.com</span> / hash_secreto_123</p>
                        <p>Trabajador: <span className="text-purple-400">ana@empresa.com</span> / hash_secreto_456</p>
                    </div>
                </div>

            </div>
        </div>
    );
}