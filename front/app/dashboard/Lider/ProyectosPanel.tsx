'use client';
import { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit3, Trash2, Users, Search, Loader2, X, ChevronDown, ChevronUp, UserPlus, UserMinus, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

interface Proyecto {
    proyecto_id: string;
    nombre_proyecto: string;
    cliente: string;
    fecha_inicio: string;
    fecha_entrega: string | null;
}

interface Asignacion {
    asignacion_id: string;
    empleado_id: string;
    nombre_empleado: string;
    proyecto_id: string;
    nombre_proyecto: string;
    rol_trabajo: string;
}

interface Empleado {
    empleado_id: string;
    nombre_empleado: string;
    alias_empleado: string;
}

interface Rol {
    rol_trabajo_id: string;
    rol_trabajo: string;
}

export default function ProyectosPanel() {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [filtro, setFiltro] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Modales
    const [showModalProyecto, setShowModalProyecto] = useState(false);
    const [editandoProyecto, setEditandoProyecto] = useState<Proyecto | null>(null);
    const [eliminandoProyecto, setEliminandoProyecto] = useState<string | null>(null);
    const [showModalAsignar, setShowModalAsignar] = useState<string | null>(null); // proyecto_id
    const [editandoRol, setEditandoRol] = useState<{ asignacion_id: string; rol_actual: string } | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [proyRes, asigRes, empRes, rolesRes] = await Promise.all([
                fetch(`${API_BASE}/proyectos`),
                fetch(`${API_BASE}/asignaciones`),
                fetch(`${API_BASE}/empleados`),
                fetch(`${API_BASE}/catalogos/roles`)
            ]);
            if (proyRes.ok) setProyectos(await proyRes.json());
            if (asigRes.ok) {
                const data = await asigRes.json();
                setAsignaciones(Array.isArray(data) ? data : []);
            }
            if (empRes.ok) setEmpleados(await empRes.json());
            if (rolesRes.ok) setRoles(await rolesRes.json());
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDeleteProyecto = async (id: string) => {
        setErrorMsg('');
        try {
            const res = await fetch(`${API_BASE}/proyectos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProyectos(prev => prev.filter(p => p.proyecto_id !== id));
                setEliminandoProyecto(null);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || 'Error al eliminar');
            }
        } catch { setErrorMsg('Error de conexión'); }
    };

    const handleDeleteAsignacion = async (asignacionId: string) => {
        try {
            const res = await fetch(`${API_BASE}/asignaciones/${asignacionId}`, { method: 'DELETE' });
            if (res.ok) {
                setAsignaciones(prev => prev.filter(a => a.asignacion_id !== asignacionId));
            }
        } catch (err) { console.error('Error eliminando asignación:', err); }
    };

    const handleUpdateRol = async (asignacionId: string, nuevoRolId: string) => {
        try {
            const res = await fetch(`${API_BASE}/asignaciones/${asignacionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rol_trabajo_id: nuevoRolId })
            });
            if (res.ok) {
                await fetchData();
                setEditandoRol(null);
            }
        } catch (err) { console.error('Error actualizando rol:', err); }
    };

    const getTeamForProject = (proyectoId: string) =>
        asignaciones.filter(a => a.proyecto_id === proyectoId);

    const proyectosFiltrados = proyectos.filter(p =>
        p.nombre_proyecto?.toLowerCase().includes(filtro.toLowerCase()) ||
        p.cliente?.toLowerCase().includes(filtro.toLowerCase())
    );

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('es-CL');
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
    );

    return (
        <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-cyan-400" />
                        Proyectos y Equipos
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">{proyectos.length} proyectos registrados</p>
                </div>
                <button onClick={() => { setEditandoProyecto(null); setShowModalProyecto(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02] cursor-pointer">
                    <Plus className="w-4 h-4" /> Nuevo Proyecto
                </button>
            </div>

            {/* Búsqueda */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={filtro} onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Buscar por nombre o cliente..."
                    className="w-full bg-[#1e2336]/80 border border-[#3b4256]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>

            {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">{errorMsg}</div>
            )}

            {/* Lista de proyectos */}
            <div className="flex flex-col gap-4">
                {proyectosFiltrados.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No se encontraron proyectos</p>
                    </div>
                ) : proyectosFiltrados.map((proy) => {
                    const team = getTeamForProject(proy.proyecto_id);
                    const isExpanded = expandedProject === proy.proyecto_id;

                    return (
                        <div key={proy.proyecto_id}
                            className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 overflow-hidden transition-all">
                            {/* Project header row */}
                            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                onClick={() => setExpandedProject(isExpanded ? null : proy.proyecto_id)}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
                                        <Briefcase className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate">{proy.nombre_proyecto}</h3>
                                        <p className="text-xs text-gray-400 truncate">{proy.cliente || 'Sin cliente'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>{formatDate(proy.fecha_inicio)} → {formatDate(proy.fecha_entrega)}</span>
                                        <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                                            <Users className="w-3 h-3" /> {team.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    <button onClick={(e) => { e.stopPropagation(); setEditandoProyecto(proy); setShowModalProyecto(true); }}
                                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer" title="Editar">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setEliminandoProyecto(proy.proyecto_id); }}
                                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer" title="Eliminar">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded: Team section */}
                            {isExpanded && (
                                <div className="border-t border-white/5 px-5 py-4 bg-black/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" /> Equipo de Trabajo
                                        </h4>
                                        <button onClick={() => setShowModalAsignar(proy.proyecto_id)}
                                            className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                                            <UserPlus className="w-3.5 h-3.5" /> Agregar Miembro
                                        </button>
                                    </div>

                                    {team.length === 0 ? (
                                        <p className="text-gray-500 text-xs text-center py-4">Sin miembros asignados</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {team.map((miembro) => (
                                                <div key={miembro.asignacion_id}
                                                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {miembro.nombre_empleado?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-white">{miembro.nombre_empleado}</span>
                                                            {editandoRol?.asignacion_id === miembro.asignacion_id ? (
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <select
                                                                        defaultValue=""
                                                                        onChange={(e) => {
                                                                            if (e.target.value) handleUpdateRol(miembro.asignacion_id, e.target.value);
                                                                        }}
                                                                        className="bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
                                                                        <option value="">Cambiar rol...</option>
                                                                        {roles.map(r => (
                                                                            <option key={r.rol_trabajo_id} value={r.rol_trabajo_id}>{r.rol_trabajo}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button onClick={() => setEditandoRol(null)} className="text-gray-400 hover:text-white cursor-pointer">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-indigo-300 font-medium">{miembro.rol_trabajo}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditandoRol({ asignacion_id: miembro.asignacion_id, rol_actual: miembro.rol_trabajo })}
                                                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer" title="Cambiar rol">
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDeleteAsignacion(miembro.asignacion_id)}
                                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer" title="Remover del equipo">
                                                            <UserMinus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal: Crear/Editar Proyecto */}
            {showModalProyecto && (
                <ModalProyecto
                    proyecto={editandoProyecto}
                    onClose={() => { setShowModalProyecto(false); setEditandoProyecto(null); }}
                    onSuccess={() => { setShowModalProyecto(false); setEditandoProyecto(null); fetchData(); }}
                />
            )}

            {/* Modal: Asignar miembro */}
            {showModalAsignar && (
                <ModalAsignarMiembro
                    proyectoId={showModalAsignar}
                    empleados={empleados}
                    roles={roles}
                    asignacionesExistentes={asignaciones.filter(a => a.proyecto_id === showModalAsignar)}
                    onClose={() => setShowModalAsignar(null)}
                    onSuccess={() => { setShowModalAsignar(null); fetchData(); }}
                />
            )}

            {/* Modal: Confirmar eliminación */}
            {eliminandoProyecto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-white">¿Eliminar proyecto?</h3>
                        <p className="text-gray-400 text-sm">Esta acción eliminará el proyecto y todas sus asignaciones. No se puede deshacer.</p>
                        {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{errorMsg}</div>}
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setEliminandoProyecto(null); setErrorMsg(''); }}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={() => handleDeleteProyecto(eliminandoProyecto)}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────

function ModalProyecto({ proyecto, onClose, onSuccess }: { proyecto: Proyecto | null; onClose: () => void; onSuccess: () => void }) {
    const isEditing = !!proyecto;
    const [nombre, setNombre] = useState(proyecto?.nombre_proyecto || '');
    const [cliente, setCliente] = useState(proyecto?.cliente || '');
    const [fechaInicio, setFechaInicio] = useState(proyecto?.fecha_inicio?.split('T')[0] || new Date().toISOString().split('T')[0]);
    const [fechaEntrega, setFechaEntrega] = useState(proyecto?.fecha_entrega?.split('T')[0] || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const url = isEditing ? `${API_BASE}/proyectos/${proyecto!.proyecto_id}` : `${API_BASE}/proyectos`;
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre, cliente,
                    fecha_inicio: fechaInicio,
                    fecha_entrega: fechaEntrega || null
                })
            });
            if (res.ok) { onSuccess(); }
            else { const data = await res.json(); setError(data.error || 'Error'); }
        } catch { setError('Error de conexión'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-4">
                    <h3 className="text-lg font-bold text-white">{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Nombre del Proyecto</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Mi Proyecto" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Cliente</label>
                        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Empresa XYZ" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Fecha Inicio</label>
                            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Fecha Entrega</label>
                            <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer" />
                        </div>
                    </div>
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">{error}</div>}
                    <div className="flex gap-3 justify-end mt-2">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer">Cancelar</button>
                        <button type="submit" disabled={loading}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20'}`}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ModalAsignarMiembro({ proyectoId, empleados, roles, asignacionesExistentes, onClose, onSuccess }: {
    proyectoId: string;
    empleados: Empleado[];
    roles: Rol[];
    asignacionesExistentes: Asignacion[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedEmpleado, setSelectedEmpleado] = useState('');
    const [selectedRol, setSelectedRol] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const empleadosDisponibles = empleados.filter(
        emp => !asignacionesExistentes.some(a => a.empleado_id === emp.empleado_id)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/asignaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empleado_id: selectedEmpleado,
                    proyecto_id: proyectoId,
                    rol_trabajo_id: selectedRol
                })
            });
            if (res.ok) { onSuccess(); }
            else { const data = await res.json(); setError(data.error || 'Error al asignar'); }
        } catch { setError('Error de conexión'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-4">
                    <h3 className="text-lg font-bold text-white">Agregar Miembro</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Trabajador</label>
                        <select value={selectedEmpleado} onChange={(e) => setSelectedEmpleado(e.target.value)} required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer">
                            <option value="">Seleccionar...</option>
                            {empleadosDisponibles.map(emp => (
                                <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_empleado}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Rol</label>
                        <select value={selectedRol} onChange={(e) => setSelectedRol(e.target.value)} required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer">
                            <option value="">Seleccionar rol...</option>
                            {roles.map(r => (
                                <option key={r.rol_trabajo_id} value={r.rol_trabajo_id}>{r.rol_trabajo}</option>
                            ))}
                        </select>
                    </div>
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">{error}</div>}
                    <div className="flex gap-3 justify-end mt-2">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer">Cancelar</button>
                        <button type="submit" disabled={loading}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/20'}`}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
