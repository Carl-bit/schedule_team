'use client';
import { useState, useEffect } from 'react';
import { Users, Briefcase, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

export default function LiderResumePanel() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [totalTrabajadores, setTotalTrabajadores] = useState(0);
    const [totalProyectos, setTotalProyectos] = useState(0);
    const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
    const [solicitudesAprobadas, setSolicitudesAprobadas] = useState(0);
    const [totalHorasPendientes, setTotalHorasPendientes] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResumen = async () => {
            try {
                setIsLoading(true);
                const storedData = localStorage.getItem('user_data');
                if (storedData) {
                    const userData = JSON.parse(storedData);
                    setNombreUsuario(userData.nombre_empleado?.split(' ')[0] || 'Líder');
                }

                const timestamp = Date.now();
                const [empleadosRes, proyectosRes, ausenciasRes, horasRes] = await Promise.all([
                    fetch(`${API_BASE}/empleados`),
                    fetch(`${API_BASE}/proyectos`),
                    fetch(`${API_BASE}/ausencias?t=${timestamp}`),
                    fetch(`${API_BASE}/hora?t=${timestamp}`)
                ]);

                if (empleadosRes.ok) {
                    const data = await empleadosRes.json();
                    setTotalTrabajadores(data.length);
                }

                if (proyectosRes.ok) {
                    const data = await proyectosRes.json();
                    setTotalProyectos(data.length);
                }

                if (ausenciasRes.ok) {
                    const data = await ausenciasRes.json();
                    if (Array.isArray(data)) {
                        setSolicitudesPendientes(data.filter((a: any) => a.estado_id === 1).length);
                        setSolicitudesAprobadas(data.filter((a: any) => a.estado_id === 2).length);
                    }
                }

                if (horasRes.ok) {
                    const data = await horasRes.json();
                    if (Array.isArray(data)) {
                        setTotalHorasPendientes(data.filter((h: any) => h.estado_id === 1).length);
                    }
                }

            } catch (err) {
                console.error('Error cargando resumen:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResumen();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
            {/* Bienvenida */}
            <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                <h1 className="text-2xl font-bold text-white mb-1">¡Hola, {nombreUsuario}! 👋</h1>
                <p className="text-gray-300 text-sm">Aquí tienes el resumen general de tu equipo.</p>
            </div>

            {/* Widgets principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Trabajadores */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                            <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Trabajadores</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-indigo-300">{totalTrabajadores}</span>
                        <span className="text-xs text-gray-500 mb-1">registrados</span>
                    </div>
                </div>

                {/* Proyectos */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-cyan-500/10 p-2 rounded-lg">
                            <Briefcase className="w-4 h-4 text-cyan-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Proyectos</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-cyan-300">{totalProyectos}</span>
                        <span className="text-xs text-gray-500 mb-1">activos</span>
                    </div>
                </div>

                {/* Solicitudes Pendientes */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Pendientes</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-amber-400">{solicitudesPendientes}</span>
                        <span className="text-xs text-gray-500 mb-1">solicitudes</span>
                    </div>
                    {totalHorasPendientes > 0 && (
                        <p className="text-[10px] text-amber-500/60 mt-2">+ {totalHorasPendientes} horas por revisar</p>
                    )}
                </div>

                {/* Aprobadas */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Aprobadas</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-emerald-400">{solicitudesAprobadas}</span>
                        <span className="text-xs text-gray-500 mb-1">confirmadas</span>
                    </div>
                </div>
            </div>

            {/* Actividad reciente */}
            <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resumen Rápido</h3>
                </div>
                <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-gray-300">Equipo total</span>
                        </div>
                        <span className="text-sm font-bold text-white">{totalTrabajadores} personas</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-gray-300">Proyectos activos</span>
                        </div>
                        <span className="text-sm font-bold text-white">{totalProyectos} proyectos</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-gray-300">Solicitudes por aprobar</span>
                        </div>
                        <span className="text-sm font-bold text-amber-400">{solicitudesPendientes + totalHorasPendientes} pendientes</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
