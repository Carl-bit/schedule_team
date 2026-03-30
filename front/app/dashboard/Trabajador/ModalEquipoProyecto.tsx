import { useEffect } from 'react';

interface Empleado {
    asignacion_id: string;
    empleado_id: string;
    nombre_empleado: string;
    rol_trabajo: string;
}

interface Proyecto {
    proyecto_id: string;
    nombre_proyecto: string;
    cliente: string | null;
    fecha_inicio: string | null;
    fecha_entrega: string | null;
}

interface ModalEquipoProyectoProps {
    proyecto: Proyecto;
    equipo: Empleado[];
    onClose: () => void;
}

export default function ModalEquipoProyecto({ proyecto, equipo, onClose }: ModalEquipoProyectoProps) {
    // Cerrar el modal con la tecla Esc
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Función para formatear fechas
    const formatearFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'No definida';
        const date = new Date(fechaStr);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Contenedor principal del Modal */}
            <div className="bg-[#1a1c29]/95 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                {/* Header del Modal */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start relative bg-gradient-to-r from-blue-900/40 to-transparent">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{proyecto.nombre_proyecto}</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            ID: {proyecto.proyecto_id.split('-')[0]}...
                        </span>
                    </div>
                    {/* Botón Cerrar */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Cerrar modal"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido (Scrollable si es muy largo) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Sección 1: Detalles del Proyecto */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
                            <p className="text-sm font-medium text-white">{proyecto.cliente || 'Interno'}</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Fecha Inicio</p>
                            <p className="text-sm font-medium text-white">{formatearFecha(proyecto.fecha_inicio)}</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Fecha Entrega</p>
                            <p className="text-sm font-medium text-white">{formatearFecha(proyecto.fecha_entrega)}</p>
                        </div>
                    </section>

                    {/* Separador */}
                    <div className="h-px bg-white/10 w-full rounded" />

                    {/* Sección 2: Equipo de Trabajo */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Integrantes del Proyecto ({equipo.length})
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {equipo.map((miembro) => (
                                <div key={miembro.asignacion_id} className="flex items-center p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-sm font-bold shadow-inner mr-3 shrink-0 text-white">
                                        {miembro.nombre_empleado.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{miembro.nombre_empleado}</p>
                                        <p className="text-xs text-blue-300 truncate">{miembro.rol_trabajo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer del Modal */}
                <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors border border-blue-400/30"
                    >
                        Cerrar Detalle
                    </button>
                </div>

            </div>
        </div>
    );
}
