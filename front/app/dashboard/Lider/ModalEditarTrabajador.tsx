'use client';
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';

interface Empleado {
    empleado_id: string;
    nombre_empleado: string;
    alias_empleado: string;
    correo_empleado: string;
    telefono_empleado: string;
    puesto_empleado: string;
    puesto_empleado_id?: string;
}

interface Puesto {
    puesto_empleado_id: string;
    puesto_empleado: string;
}

interface ModalEditarTrabajadorProps {
    empleado: Empleado;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalEditarTrabajador({ empleado, onClose, onSuccess }: ModalEditarTrabajadorProps) {
    const [nombre, setNombre] = useState(empleado.nombre_empleado || '');
    const [alias, setAlias] = useState(empleado.alias_empleado || '');
    const [telefono, setTelefono] = useState(empleado.telefono_empleado || '');
    const [correo, setCorreo] = useState(empleado.correo_empleado || '');
    const [puestoId, setPuestoId] = useState(empleado.puesto_empleado_id || '');
    const [puestos, setPuestos] = useState<Puesto[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/catalogos/puestos`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setPuestos(data); })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/empleados/${empleado.empleado_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre_empleado: nombre,
                    alias_empleado: alias,
                    telefono_empleado: telefono,
                    correo_empleado: correo,
                    puesto_empleado_id: puestoId || undefined
                }),
            });

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al actualizar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-4">
                    <h3 className="text-lg font-bold text-white">Editar Trabajador</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Nombre</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Correo</label>
                        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                        {correo !== empleado.correo_empleado && (
                            <p className="text-[10px] text-amber-400 mt-1">⚠ Se enviará notificación al nuevo correo</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Puesto</label>
                        <select value={puestoId} onChange={(e) => setPuestoId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                            <option value="">Seleccionar puesto...</option>
                            {puestos.map(p => (
                                <option key={p.puesto_empleado_id} value={p.puesto_empleado_id}>{p.puesto_empleado}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Alias</label>
                            <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Teléfono</label>
                            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">{error}</div>
                    )}

                    <div className="flex gap-3 justify-end mt-2">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20'}`}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
