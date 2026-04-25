'use client';
import { useState } from 'react';
import ModalModificar from './ModalModificar';
import { useUser } from '@/app/hooks/useUser';

export default function ContentProfile() {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { user: userData, refresh: refrescarDatos } = useUser();

    const user = {
        empleado_id: userData?.empleado_id || '',
        nombre: userData?.nombre_empleado || 'Usuario',
        alias: userData?.alias_empleado || 'Alias',
        rol: userData?.puesto_empleado || 'Trabajador',
        email: userData?.correo_empleado || 'correo@ejemplo.com',
        telefono: userData?.telefono_empleado || '+56 9 ...',
    };

    return (
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--pr-bsub)' }}>
            <div className="flex justify-end mb-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-colors hover:text-white cursor-pointer"
                    style={{ background: 'var(--pr-bsub)', color: 'var(--pr-fgm)', border: 'none' }}
                >
                    {isExpanded ? '˄' : '˅'}
                </button>
            </div>

            <div className="flex flex-col items-center gap-3 mb-4">
                <div
                    className="rounded-full flex items-center justify-center text-xl font-extrabold text-white"
                    style={{
                        background: 'var(--pr-primary)',
                        width: 64, height: 64,
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        boxShadow: '0 0 20px rgba(124,58,237,0.3)'
                    }}
                >
                    {user.alias.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                    <p className="font-extrabold text-base" style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {user.alias}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pr-fgm)' }}>{user.rol}</p>
                </div>
            </div>

            <div
                className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="rounded-xl p-4 flex flex-col gap-3 mb-3"
                        style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                        {[
                            ['NOMBRE', user.nombre],
                            ['EMAIL', user.email],
                            ['TELÉFONO', user.telefono],
                            ['ROL', user.rol],
                        ].map(([l, v]) => (
                            <div key={l}>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1"
                                    style={{ color: 'var(--pr-fgs)' }}>
                                    {l}
                                </p>
                                <p className="text-sm font-semibold break-words" style={{ color: 'var(--pr-fg)' }}>
                                    {v}
                                </p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                        style={{
                            background: 'var(--pr-primary)',
                            boxShadow: '0 0 14px rgba(124,58,237,0.3)',
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            border: 'none'
                        }}
                    >
                        Modificar Datos
                    </button>
                </div>
            </div>

            {showModal && (
                <ModalModificar
                    user={user}
                    onClose={() => setShowModal(false)}
                    onActualizar={refrescarDatos}
                />
            )}
        </div>
    );
}
