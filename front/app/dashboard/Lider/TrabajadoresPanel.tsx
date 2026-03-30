'use client';
import { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import ModalNuevoTrabajador from './ModalNuevoTrabajador';
import ModalEditarTrabajador from './ModalEditarTrabajador';

import { API_BASE } from '@/app/lib/api';
import type { Empleado } from '@/app/types';

export default function TrabajadoresPanel() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [filtro, setFiltro] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showModalNuevo, setShowModalNuevo] = useState(false);
    const [editando, setEditando] = useState<Empleado | null>(null);
    const [eliminando, setEliminando] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchEmpleados = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/empleados`);
            if (res.ok) {
                const data = await res.json();
                setEmpleados(data);
            }
        } catch (err) {
            console.error('Error cargando empleados:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpleados();
    }, []);

    const handleDelete = async (id: string) => {
        setErrorMsg('');
        try {
            const res = await fetch(`${API_BASE}/empleados/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setEmpleados(prev => prev.filter(e => e.empleado_id !== id));
                setEliminando(null);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || 'Error al eliminar');
            }
        } catch (err) {
            setErrorMsg('Error de conexión al eliminar');
        }
    };

    const empleadosFiltrados = empleados.filter(e =>
        e.nombre_empleado?.toLowerCase().includes(filtro.toLowerCase()) ||
        e.alias_empleado?.toLowerCase().includes(filtro.toLowerCase()) ||
        e.correo_empleado?.toLowerCase().includes(filtro.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-400" />
                        Gestión de Trabajadores
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">{empleados.length} trabajadores registrados</p>
                </div>
                <button
                    onClick={() => setShowModalNuevo(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Agregar Trabajador
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Buscar por nombre, alias o correo..."
                    className="w-full bg-[#1e2336]/80 border border-[#3b4256]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>

            {/* Error message */}
            {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                    {errorMsg}
                </div>
            )}

            {/* Tabla de empleados */}
            <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 overflow-hidden">
                {/* Header de tabla */}
                <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-[#151825] border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    <span>Nombre</span>
                    <span>Alias</span>
                    <span>Email</span>
                    <span>Puesto</span>
                    <span>Teléfono</span>
                    <span>Acciones</span>
                </div>

                {/* Filas */}
                <div className="flex flex-col divide-y divide-white/5">
                    {empleadosFiltrados.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No se encontraron trabajadores</p>
                        </div>
                    ) : (
                        empleadosFiltrados.map((emp) => (
                            <div
                                key={emp.empleado_id}
                                className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                                        {(emp.alias_empleado || emp.nombre_empleado || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-white truncate">{emp.nombre_empleado}</span>
                                </div>
                                <span className="text-sm text-gray-300 truncate">{emp.alias_empleado || '—'}</span>
                                <span className="text-sm text-gray-400 truncate">{emp.correo_empleado}</span>
                                <span className="text-xs text-indigo-300 font-medium truncate">{emp.puesto_empleado || '—'}</span>
                                <span className="text-sm text-gray-400 truncate">{emp.telefono_empleado || '—'}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditando(emp)}
                                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                                        title="Editar"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setEliminando(emp.empleado_id)}
                                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {eliminando && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-white">¿Eliminar trabajador?</h3>
                        <p className="text-gray-400 text-sm">Esta acción no se puede deshacer. El trabajador será eliminado permanentemente del sistema.</p>
                        {errorMsg && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {errorMsg}
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setEliminando(null); setErrorMsg(''); }}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(eliminando)}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para agregar trabajador */}
            {showModalNuevo && (
                <ModalNuevoTrabajador
                    onClose={() => setShowModalNuevo(false)}
                    onSuccess={() => {
                        setShowModalNuevo(false);
                        fetchEmpleados();
                    }}
                />
            )}

            {/* Modal para editar trabajador */}
            {editando && (
                <ModalEditarTrabajador
                    empleado={editando}
                    onClose={() => setEditando(null)}
                    onSuccess={() => {
                        setEditando(null);
                        fetchEmpleados();
                    }}
                />
            )}
        </div>
    );
}
