'use client';
import { useState } from 'react';
import ReflectiveCard from '../../components/UI/ReflectiveCard';
import ModalModificar from './ModalModificar';
import { useUser } from '@/app/hooks/useUser';

export default function ContentProfile() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { user: userData, refresh: refrescarDatos } = useUser();

    const user = {
        empleado_id: userData?.empleado_id || '',
        nombre: userData?.nombre_empleado || 'Usuario',
        alias: userData?.alias_empleado || 'Alias',
        rol: userData?.puesto_empleado || 'Trabajador',
        email: userData?.correo_empleado || 'correo@ejemplo.com',
        telefono: userData?.telefono_empleado || '+56 9 ...'
    };

    // 3. Renderizamos SOLO la tarjeta (con toda su lógica de expansión)
    return (
        <div className={`relative w-full transition-all duration-500 ease-in-out`}>
            <ReflectiveCard className="min-h-[5rem]">
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
                            {user.alias.charAt(0)}
                        </div>
                        <h3 className="text-lg font-bold text-center leading-tight">{user.alias}</h3>
                        <p className="text-blue-300 text-sm mb-2">{user.rol}</p>

                    </div>

                    {/* Cuerpo Expandible */}
                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                            {/* Contenedor de datos */}
                            <div className="bg-black/20 rounded-lg p-4 space-y-3 backdrop-blur-sm">
                                {/* Elemento 0: Nombre (Delay 0ms) */}
                                <div className={`transition-all duration-500 ${isExpanded ? 'opacity-100 translate-y-0 delay-0' : 'opacity-0 translate-y-4'}`}>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Nombre</p>
                                    <p className="text-sm font-medium truncate">{user.nombre}</p>
                                </div>

                                {/* Elemento 1: Email (Delay 100ms) */}
                                <div className={`transition-all duration-500 ${isExpanded ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-4'}`}>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                </div>

                                {/* Elemento 2: Teléfono (Delay 200ms) */}
                                <div className={`transition-all duration-500 ${isExpanded ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-4'}`}>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Teléfono</p>
                                    <p className="text-sm font-medium truncate">{user.telefono}</p>
                                </div>

                                {/* Elemento 3: Rol (Delay 300ms) */}
                                <div className={`transition-all duration-500 ${isExpanded ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-4'}`}>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Rol</p>
                                    <p className="text-sm font-medium truncate">{user.rol}</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                {/* Elemento 3: Botón (Delay 300ms) */}
                <button onClick={() => setShowModal(true)} className={`w-full mt-2 bg-blue-600/80 hover:bg-blue-500 text-white text-xs py-2 rounded shadow-lg transition-all duration-500 ${isExpanded ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-4'}`}>
                    Modificar Datos
                </button>

                {showModal && (
                    <ModalModificar
                        user={user}
                        onClose={() => setShowModal(false)}
                        onActualizar={refrescarDatos}
                    />
                )}
            </ReflectiveCard>
        </div>
    );
}