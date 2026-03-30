import { useState, useEffect } from 'react';
import ModalEquipoProyecto from './ModalEquipoProyecto';
import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import type { Asignacion } from '@/app/types';

interface EquipoMiembro {
    asignacion_id: string;
    empleado_id: string;
    nombre_empleado: string;
    rol_trabajo: string;
}

interface ProyectoGroup {
    proyecto_id: string;
    nombre_proyecto: string;
    cliente: string | null;
    fecha_inicio: string | null;
    fecha_entrega: string | null;
    equipo: EquipoMiembro[];
}

export default function EquiposPanel() {
    const { user } = useUser();
    const [proyectosAgrupados, setProyectosAgrupados] = useState<ProyectoGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoGroup | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchEquipos = async () => {
            try {
                setIsLoading(true);
                const currentUserId = user.empleado_id;

                // 2. Traer todas las asignaciones
                const response = await fetch(`${API_BASE}/asignaciones`);
                if (!response.ok) throw new Error('Error al cargar los equipos');
                const data: Asignacion[] = await response.json();

                // 3. Agrupar por Proyecto
                const mapProyectos = new Map<string, ProyectoGroup>();

                data.forEach((item) => {
                    if (!mapProyectos.has(item.proyecto_id)) {
                        mapProyectos.set(item.proyecto_id, {
                            proyecto_id: item.proyecto_id,
                            nombre_proyecto: item.nombre_proyecto,
                            cliente: item.cliente,
                            fecha_inicio: item.fecha_inicio,
                            fecha_entrega: item.fecha_entrega,
                            equipo: []
                        });
                    }

                    const proyectoGroup = mapProyectos.get(item.proyecto_id)!;
                    proyectoGroup.equipo.push({
                        asignacion_id: item.asignacion_id,
                        empleado_id: item.empleado_id,
                        nombre_empleado: item.nombre_empleado,
                        rol_trabajo: item.rol_trabajo
                    });
                });

                // 4. Filtrar Proyectos donde el usuario actual esté asignado
                const proyectosDelUsuario = Array.from(mapProyectos.values()).filter(proj =>
                    proj.equipo.some(miembro => miembro.empleado_id === currentUserId)
                );

                setProyectosAgrupados(proyectosDelUsuario);

            } catch (err: any) {
                console.error(err);
                setError(err.message || 'No se pudieron cargar los equipos. Intenta de nuevo.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEquipos();
    }, [user]);

    // Formatear Fecha
    const formatearFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'No definida';
        const date = new Date(fechaStr);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-blue-400 animate-pulse">Cargando tus proyectos y equipos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 text-white space-y-6 relative h-full">
            <h2 className="text-2xl font-bold">Mis Equipos de Trabajo</h2>
            <p className="text-gray-300">Selecciona un proyecto para ver los miembros de tu equipo.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {proyectosAgrupados.length > 0 ? (
                    proyectosAgrupados.map((proyecto) => (
                        <div
                            key={proyecto.proyecto_id}
                            onClick={() => setProyectoSeleccionado(proyecto)}
                            className="bg-[#1e2336]/80 backdrop-blur-md border border-[#3b4256]/50 p-5 rounded-2xl cursor-pointer hover:bg-[#252a40]/90 hover:border-[#4f5872] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
                        >
                            {/* Un leve resplandor de fondo en Hover */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>

                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-xl leading-tight line-clamp-2 pr-4">{proyecto.nombre_proyecto}</h3>
                                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-black/20 p-2 rounded border border-white/5">
                                        <p className="text-gray-400 text-xs mb-0.5">Cliente</p>
                                        <p className="font-medium text-gray-200 truncate">{proyecto.cliente || 'Interno'}</p>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded border border-white/5">
                                        <p className="text-gray-400 text-xs mb-0.5">Entrega</p>
                                        <p className="font-medium text-gray-200 truncate">{formatearFecha(proyecto.fecha_entrega)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {/* Muestra hasta 3 avatares */}
                                    {proyecto.equipo.slice(0, 3).map((miembro, idx) => (
                                        <div key={miembro.asignacion_id} className={`w-8 h-8 rounded-full border-2 border-[#1e2336] flex items-center justify-center text-xs font-bold text-white shadow-sm z-[${10 - idx}] ${idx % 2 === 0 ? 'bg-gradient-to-tr from-blue-600 to-cyan-500' : 'bg-gradient-to-tr from-purple-600 to-pink-500'}`}>
                                            {miembro.nombre_empleado.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                {proyecto.equipo.length > 3 && (
                                    <span className="text-xs text-gray-400 font-medium ml-1">
                                        +{proyecto.equipo.length - 3} más
                                    </span>
                                )}
                                <span className="text-xs text-blue-400 ml-auto group-hover:text-blue-300 font-medium">Ver detalles &rarr;</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-gray-400 text-lg">No estás asignado a ningún proyecto actualmente.</p>
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            {proyectoSeleccionado && (
                <ModalEquipoProyecto
                    proyecto={proyectoSeleccionado}
                    equipo={proyectoSeleccionado.equipo}
                    onClose={() => setProyectoSeleccionado(null)}
                />
            )}
        </div>
    );
}