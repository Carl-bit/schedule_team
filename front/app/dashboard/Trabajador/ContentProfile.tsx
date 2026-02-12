'use client'; // Importante porque usa hooks
import { useState, useEffect } from 'react';
import ReflectiveCard from '../../components/UI/ReflectiveCard';

export default function ContentProfile() {
    // 1. Nos traemos los estados que estaban en el otro archivo
    const [isExpanded, setIsExpanded] = useState(false);
    const [user, setUser] = useState({
        nombre: 'Cargando...',
        rol: '...',
        email: '...',
        telefono: ''
    });

    // 2. Nos traemos el efecto de carga de datos
    useEffect(() => {
        const storedData = localStorage.getItem('user_data');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setUser({
                nombre: parsedData.nombre_empleado || 'Usuario',
                rol: parsedData.puesto_empleado_id || 'Trabajador',
                email: parsedData.email || 'correo@ejemplo.com',
                telefono: parsedData.telefono || '+56 9 ...'
            });
        }
    }, []);

    // 3. Renderizamos SOLO la tarjeta (con toda su lógica de expansión)
    return (
        <div className={`relative w-full transition-all duration-500 ease-in-out`}>
            <ReflectiveCard className="w-full h-full min-h-[5rem]">
                <div className="flex flex-col h-full text-white p-6 relative z-20">
                    {/* Botón Flecha */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all focus:outline-none z-20 border border-white/10"
                    >
                        <svg
                            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {/* Header: Avatar y Nombre */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-2xl font-bold mb-3 shadow-lg shadow-cyan-500/20 shrink-0">
                            {user.nombre.charAt(0)}
                        </div>
                        <h3 className="text-lg font-bold text-center leading-tight">{user.nombre}</h3>
                        <p className="text-blue-300 text-sm mb-2">{user.rol}</p>

                    </div>

                    {/* Cuerpo Expandible */}
                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                            <div className={`bg-black/20 rounded-lg p-4 space-y-3 backdrop-blur-sm transition-all duration-500 ${isExpanded ? 'opacity-100 delay-100' : 'opacity-0'}`}>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                                    <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
                <button className={`w-full
                    p-6 rounded-xl backdrop-blur-sm
                    mt-2 bg-blue-600/80 hover:bg-blue-500 text-white text-xs 
                    py-2 rounded shadow-lg 
                    transition-all duration-500 ease-in-out 
                    ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    Modificar Datos
                </button>
            </ReflectiveCard>
        </div>
    );
}