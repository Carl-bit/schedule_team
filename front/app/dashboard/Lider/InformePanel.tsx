'use client';
import { useState, useEffect, useMemo } from 'react';
import { FileBarChart, Calendar, Users, Clock, CalendarOff, Briefcase, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';

import type { Empleado } from '@/app/types';

interface InformeData {
    horasPlanificadas: number;
    horasTrabajadas: number;
    horasPendientes: number;
    totalPlanificaciones: number;
    totalRegistros: number;
    ausencias: number;
    ausenciasPendientes: number;
    equipos: number;
}

export default function InformePanel() {
    const { user: currentUser } = useUser();
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [selectedEmpleado, setSelectedEmpleado] = useState('');
    const [filterStartDate, setFilterStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [filterEndDate, setFilterEndDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        return d.toISOString().split('T')[0];
    });

    const [showHoras, setShowHoras] = useState(true);
    const [showAusencias, setShowAusencias] = useState(true);
    const [showComparacion, setShowComparacion] = useState(true);
    const [showEquipos, setShowEquipos] = useState(true);

    const [informeData, setInformeData] = useState<InformeData | null>(null);
    const [comparacionData, setComparacionData] = useState<InformeData | null>(null);
    const [prevPeriodLabel, setPrevPeriodLabel] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

    useEffect(() => {
        const fetchEmpleados = async () => {
            try {
                const res = await fetch(`${API_BASE}/empleados`);
                if (res.ok) {
                    const data = await res.json();
                    setEmpleados(data);
                }
            } catch (err) {
                console.error('Error cargando empleados:', err);
            }
        };
        fetchEmpleados();
    }, []);

    // Helper: extrae YYYY-MM-DD de un timestamp sin depender de timezone
    const toLocalDateStr = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Helper: parsea "YYYY-MM-DD" como fecha LOCAL (no UTC)
    const parseLocalDate = (str: string) => {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const diasSeleccionados = useMemo(() => {
        if (!filterStartDate || !filterEndDate) return 0;
        const start = parseLocalDate(filterStartDate);
        const end = parseLocalDate(filterEndDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(0, diff);
    }, [filterStartDate, filterEndDate]);

    useEffect(() => {
        if (!selectedEmpleado || !filterStartDate || !filterEndDate) {
            setInformeData(null);
            setComparacionData(null);
            return;
        }

        // Helper: calcula horas de planificacion y registro para un rango dado
        const calcularHorasEnRango = (
            planData: any[], horasData: any[], ausData: any[],
            rangoStart: string, rangoEnd: string, empleadoId: string
        ) => {
            let horasPlanificadas = 0;
            let totalPlanificaciones = 0;
            let horasPendientes = 0;

            if (Array.isArray(planData)) {
                planData.forEach((item: any) => {
                    const inicio = new Date(item.inicio_turno);
                    const dateStr = toLocalDateStr(inicio);
                    if (dateStr >= rangoStart && dateStr <= rangoEnd) {
                        if (item.fin_turno) {
                            const fin = new Date(item.fin_turno);
                            const h = (fin.getTime() - inicio.getTime()) / (1000 * 3600);
                            if (h > 0) {
                                if (item.estado_id === 2) {
                                    horasPlanificadas += h;
                                } else if (item.estado_id === 1) {
                                    horasPendientes += h;
                                }
                                totalPlanificaciones++;
                            }
                        }
                    }
                });
            }

            let horasTrabajadas = 0;
            let totalRegistros = 0;
            if (Array.isArray(horasData)) {
                horasData.forEach((h: any) => {
                    const inicio = new Date(h.inicio_trabajo);
                    const dateStr = toLocalDateStr(inicio);
                    if (dateStr >= rangoStart && dateStr <= rangoEnd) {
                        totalRegistros++;
                        if (h.fin_trabajo) {
                            const fin = new Date(h.fin_trabajo);
                            horasTrabajadas += (fin.getTime() - inicio.getTime()) / (1000 * 3600);
                        }
                    }
                });
            }

            let ausencias = 0;
            let ausenciasPendientes = 0;
            if (Array.isArray(ausData)) {
                ausData.forEach((a: any) => {
                    const inicio = new Date(a.inicio_ausencia);
                    const dateStr = toLocalDateStr(inicio);
                    if (dateStr >= rangoStart && dateStr <= rangoEnd) {
                        ausencias++;
                        if (a.estado_id === 1) ausenciasPendientes++;
                    }
                });
            }

            return { horasPlanificadas, horasTrabajadas, horasPendientes, totalPlanificaciones, totalRegistros, ausencias, ausenciasPendientes };
        };

        const fetchInforme = async () => {
            setIsLoading(true);
            try {
                const timestamp = Date.now();
                const [planRes, horasRes, ausenciasRes, asignacionesRes] = await Promise.all([
                    fetch(`${API_BASE}/planificacion/${selectedEmpleado}?t=${timestamp}`),
                    fetch(`${API_BASE}/hora/${selectedEmpleado}?t=${timestamp}`),
                    fetch(`${API_BASE}/ausencias/${selectedEmpleado}?t=${timestamp}`),
                    fetch(`${API_BASE}/asignaciones`)
                ]);

                const planData = planRes.ok ? await planRes.json() : [];
                const horasData = horasRes.ok ? await horasRes.json() : [];
                const ausData = ausenciasRes.ok ? await ausenciasRes.json() : [];
                const asignacionesData = asignacionesRes.ok ? await asignacionesRes.json() : [];

                // Equipos (no depende del rango)
                let equipos = 0;
                if (Array.isArray(asignacionesData)) {
                    const proyectos = new Set<string>();
                    asignacionesData.forEach((item: any) => {
                        if (item.empleado_id === selectedEmpleado) {
                            proyectos.add(item.proyecto_id);
                        }
                    });
                    equipos = proyectos.size;
                }

                // Current period
                const current = calcularHorasEnRango(planData, horasData, ausData, filterStartDate, filterEndDate, selectedEmpleado);
                setInformeData({ ...current, equipos });

                // Comparison with previous period (shifted by calendar months)
                if (showComparacion) {
                    const startDate = parseLocalDate(filterStartDate);
                    const endDate = parseLocalDate(filterEndDate);

                    const monthsSpan =
                        (endDate.getFullYear() - startDate.getFullYear()) * 12
                        + (endDate.getMonth() - startDate.getMonth()) + 1;

                    const prevStart = new Date(startDate.getFullYear(), startDate.getMonth() - monthsSpan, startDate.getDate());
                    const prevEnd = new Date(endDate.getFullYear(), endDate.getMonth() - monthsSpan, endDate.getDate());

                    const prevStartStr = toLocalDateStr(prevStart);
                    const prevEndStr = toLocalDateStr(prevEnd);

                    const prev = calcularHorasEnRango(planData, horasData, ausData, prevStartStr, prevEndStr, selectedEmpleado);
                    setPrevPeriodLabel(`${formatDateDMY(prevStartStr)} — ${formatDateDMY(prevEndStr)}`);
                    setComparacionData({ ...prev, equipos });
                } else {
                    setComparacionData(null);
                    setPrevPeriodLabel('');
                }
            } catch (err) {
                console.error('Error cargando informe:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInforme();
    }, [selectedEmpleado, filterStartDate, filterEndDate, showComparacion]);

    // Calendar helpers
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const isDateInRange = (day: number, month: number, year: number) => {
        if (!filterStartDate || !filterEndDate) return false;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr >= filterStartDate && dateStr <= filterEndDate;
    };

    const isToday = (day: number, month: number, year: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

    const prevMonth = () => {
        if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
        else { setCalendarMonth(calendarMonth - 1); }
    };
    const nextMonth = () => {
        if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
        else { setCalendarMonth(calendarMonth + 1); }
    };

    // Calculate second month
    const secondMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const secondYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;

    // dd-mm-yyyy formatter
    const formatDateDMY = (dateStr: string) => {
        if (!dateStr) return '—';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    // PDF generation
    const generatePDF = () => {
        if (!informeData || !selectedEmpleado) return;
        const empName = empleados.find(e => e.empleado_id === selectedEmpleado)?.nombre_empleado || 'Empleado';
        const empPuesto = empleados.find(e => e.empleado_id === selectedEmpleado)?.puesto_empleado || '';
        const liderName = currentUser?.nombre_empleado || 'Líder';

        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        let y = 20;

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Schedule Test', pageW / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Sistema de Registro de Horas', pageW / 2, y, { align: 'center' });
        y += 10;
        doc.setDrawColor(180);
        doc.line(20, y, pageW - 20, y);
        y += 10;

        // Report metadata
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Informe de Horas Trabajadas', 20, y);
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const today = new Date();
        doc.text(`Fecha de creación: ${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`, 20, y);
        y += 6;
        doc.text(`Generado por: ${liderName}`, 20, y);
        y += 6;
        doc.text(`Evaluado: ${empName} — ${empPuesto}`, 20, y);
        y += 6;
        doc.text(`Período: ${formatDateDMY(filterStartDate)} al ${formatDateDMY(filterEndDate)} (${diasSeleccionados} días)`, 20, y);
        y += 10;

        // Description
        doc.setDrawColor(220);
        doc.setFillColor(245, 245, 250);
        doc.roundedRect(20, y, pageW - 40, 20, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(80);
        const filters = [];
        if (showHoras) filters.push('horas planificadas y trabajadas');
        if (showAusencias) filters.push('ausencias');
        if (showEquipos) filters.push('equipos asignados');
        doc.text(`Se contabilizan las horas de ${empName} considerando: ${filters.join(', ')}.`, 25, y + 8);
        doc.text(`Correspondientes al período ${formatDateDMY(filterStartDate)} al ${formatDateDMY(filterEndDate)} (${diasSeleccionados} días).`, 25, y + 14);
        y += 28;

        // Hours detail table
        if (showHoras) {
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('Desglose de Horas', 20, y);
            y += 8;

            // Table header
            doc.setFillColor(50, 50, 80);
            doc.setTextColor(255);
            doc.rect(20, y, pageW - 40, 8, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Concepto', 25, y + 5.5);
            doc.text('Valor', pageW - 45, y + 5.5, { align: 'right' });
            y += 8;

            // Table rows
            doc.setTextColor(0);
            doc.setFont('helvetica', 'normal');
            const totalHoras = informeData.horasPlanificadas + informeData.horasTrabajadas;
            const rows = [
                ['Turnos planificados (aprobados)', `${informeData.totalPlanificaciones}`],
                ['Horas planificadas', `${informeData.horasPlanificadas.toFixed(1)}h`],
                ['Registros de jornada', `${informeData.totalRegistros}`],
                ['Horas trabajadas (registro)', `${informeData.horasTrabajadas.toFixed(1)}h`],
                ['Horas pendientes de revision', `${informeData.horasPendientes.toFixed(1)}h`],
            ];
            rows.forEach(([label, value], i) => {
                if (i % 2 === 0) { doc.setFillColor(248, 248, 252); doc.rect(20, y, pageW - 40, 7, 'F'); }
                doc.text(label, 25, y + 5);
                doc.text(value, pageW - 45, y + 5, { align: 'right' });
                y += 7;
            });
            y += 5;

            // Total box
            doc.setFillColor(50, 50, 80);
            doc.setTextColor(255);
            doc.roundedRect(20, y, pageW - 40, 12, 2, 2, 'F');
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL HORAS (PLANIF. + TRAB.)', 25, y + 8);
            doc.text(`${totalHoras.toFixed(1)}h`, pageW - 45, y + 8, { align: 'right' });
            y += 20;
        }

        // Absences
        if (showAusencias) {
            doc.setTextColor(0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Ausencias', 20, y);
            y += 7;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total registradas: ${informeData.ausencias}`, 25, y);
            y += 5;
            doc.text(`Pendientes de aprobación: ${informeData.ausenciasPendientes}`, 25, y);
            y += 10;
        }

        // Teams
        if (showEquipos) {
            doc.setTextColor(0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Equipos Asignados', 20, y);
            y += 7;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Proyectos activos: ${informeData.equipos}`, 25, y);
            y += 10;
        }

        // Comparison
        if (showComparacion && comparacionData) {
            doc.setDrawColor(200);
            doc.line(20, y, pageW - 20, y);
            y += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.text('Comparación con Período Anterior', 20, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            if (showHoras) {
                const prevTotal = comparacionData.horasPlanificadas + comparacionData.horasTrabajadas;
                const currTotal = informeData.horasPlanificadas + informeData.horasTrabajadas;
                const diff = currTotal - prevTotal;
                const pct = prevTotal > 0 ? ((diff / prevTotal) * 100).toFixed(1) : '—';
                doc.text(`Planificadas anterior: ${comparacionData.horasPlanificadas.toFixed(1)}h (${comparacionData.totalPlanificaciones} turnos)`, 25, y);
                y += 5;
                doc.text(`Trabajadas anterior: ${comparacionData.horasTrabajadas.toFixed(1)}h (${comparacionData.totalRegistros} reg.)`, 25, y);
                y += 5;
                doc.text(`Diferencia total: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}h (${pct}%)`, 25, y);
                y += 7;
            }
            if (showAusencias) {
                doc.text(`Ausencias período anterior: ${comparacionData.ausencias}`, 25, y);
                y += 10;
            }
        }

        // Footer
        y = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generado automáticamente por Schedule Test — ${new Date().toLocaleString('es-CL')}`, pageW / 2, y, { align: 'center' });

        doc.save(`informe_${empName.replace(/\s+/g, '_')}_${filterStartDate}_${filterEndDate}.pdf`);
    };

    // Click handler for calendar day
    const [rangeMode, setRangeMode] = useState<'start' | 'end'>('start');

    const handleDayClick = (day: number, month: number, year: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (rangeMode === 'start') {
            setFilterStartDate(dateStr);
            setRangeMode('end');
            // If new start is after current end, reset end
            if (dateStr > filterEndDate) setFilterEndDate(dateStr);
        } else {
            if (dateStr < filterStartDate) {
                // Clicked before start → swap: this becomes start
                setFilterStartDate(dateStr);
            } else {
                setFilterEndDate(dateStr);
            }
            setRangeMode('start');
        }
    };

    // Render a single calendar month (clickable)
    const renderCalendar = (month: number, year: number) => {
        const days = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        return (
            <div className="bg-black/20 rounded-xl border border-white/5 p-5">
                <div className="text-center mb-4">
                    <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {dayNames.map(d => (
                        <div key={`${month}-${d}`} className="text-center text-[11px] text-gray-500 font-bold py-1.5">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${month}-${i}`} className="py-4"></div>
                    ))}
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const inRange = isDateInRange(day, month, year);
                        const today = isToday(day, month, year);
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isStart = dateStr === filterStartDate;
                        const isEnd = dateStr === filterEndDate;
                        return (
                            <button key={`${month}-${day}`}
                                onClick={() => handleDayClick(day, month, year)}
                                className={`text-center py-4 text-xs rounded-lg transition-all cursor-pointer
                                    ${isStart || isEnd ? 'bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/30' : inRange ? 'bg-indigo-600/30 text-indigo-200 font-bold hover:bg-indigo-600/50' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                                    ${today ? 'ring-1 ring-amber-400' : ''}
                                `}
                            >{day}</button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileBarChart className="w-6 h-6 text-violet-400" />
                    Informes
                </h2>
                <p className="text-gray-300 text-sm mt-1">Analiza el rendimiento de tu equipo</p>
            </div>

            {/* Layout: 4 columnas — Evaluar(1) | Rango de Tiempo(2) | Resultados(1) */}
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-5">
                {/* SECCIÓN 1: Selección de empleado (compacta) */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Evaluar a</h3>
                    </div>
                    <select
                        value={selectedEmpleado}
                        onChange={(e) => setSelectedEmpleado(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                        <option value="">Seleccionar...</option>
                        {empleados.map((emp) => (
                            <option key={emp.empleado_id} value={emp.empleado_id}>
                                {emp.nombre_empleado}
                            </option>
                        ))}
                    </select>

                    {selectedEmpleado && (
                        <div className="p-2 bg-indigo-900/20 rounded-lg border border-indigo-700/30">
                            <p className="text-xs text-indigo-300 font-medium">
                                {empleados.find(e => e.empleado_id === selectedEmpleado)?.nombre_empleado}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {empleados.find(e => e.empleado_id === selectedEmpleado)?.puesto_empleado}
                            </p>
                        </div>
                    )}

                    {/* Filtros — pill-style toggles */}
                    <div className="border-t border-white/5 pt-3">
                        <h4 className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Filtros</h4>
                        <div className="flex flex-col gap-1.5">
                            <button onClick={() => setShowHoras(!showHoras)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                                    ${showHoras ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-black/20 text-gray-500 border border-white/5 hover:border-gray-600'}`}>
                                <Clock className="w-3.5 h-3.5" />
                                Horas trabajadas
                            </button>
                            <button onClick={() => setShowAusencias(!showAusencias)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                                    ${showAusencias ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-black/20 text-gray-500 border border-white/5 hover:border-gray-600'}`}>
                                <CalendarOff className="w-3.5 h-3.5" />
                                Ausencias
                            </button>
                            <button onClick={() => setShowComparacion(!showComparacion)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                                    ${showComparacion ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-black/20 text-gray-500 border border-white/5 hover:border-gray-600'}`}>
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Comparar período
                            </button>
                            <button onClick={() => setShowEquipos(!showEquipos)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                                    ${showEquipos ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-black/20 text-gray-500 border border-white/5 hover:border-gray-600'}`}>
                                <Briefcase className="w-3.5 h-3.5" />
                                Equipos
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: Calendario como Rango Picker */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rango de Tiempo</h3>
                    </div>

                    {/* Period summary bar */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className={`p-2.5 rounded-xl border text-center transition-all ${rangeMode === 'start' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-black/20 border-white/5'}`}>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Desde</p>
                            <p className="text-sm font-bold text-indigo-300">{formatDateDMY(filterStartDate)}</p>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-lg font-black text-indigo-400">{diasSeleccionados}</span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">días</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-center transition-all ${rangeMode === 'end' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-black/20 border-white/5'}`}>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Hasta</p>
                            <p className="text-sm font-bold text-indigo-300">{formatDateDMY(filterEndDate)}</p>
                        </div>
                    </div>

                    {/* Navigation arrows */}
                    <div className="flex items-center justify-between">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-xs text-gray-400">
                            {monthNames[calendarMonth]} — {monthNames[secondMonth]} {secondYear}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* 2 calendarios lado a lado */}
                    <div className="grid grid-cols-2 gap-3">
                        {renderCalendar(calendarMonth, calendarYear)}
                        {renderCalendar(secondMonth, secondYear)}
                    </div>
                </div>

                {/* SECCIÓN 3: Resultados (compacta) */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <FileBarChart className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resultados</h3>
                    </div>

                    {!selectedEmpleado ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-gray-500 text-xs text-center">Selecciona un trabajador</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                    ) : informeData ? (
                        <div className="flex flex-col gap-2.5">
                            {showHoras && (
                                <>
                                    {/* Planificadas */}
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Planificadas</span>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-xl font-black text-indigo-300">
                                                {informeData.horasPlanificadas.toFixed(1).replace(/\.0$/, '')}h
                                            </span>
                                            <span className="text-[10px] text-gray-500 mb-0.5">{informeData.totalPlanificaciones} turnos</span>
                                        </div>
                                        {showComparacion && comparacionData && (() => {
                                            const diff = informeData.horasPlanificadas - comparacionData.horasPlanificadas;
                                            const pct = comparacionData.horasPlanificadas > 0 ? ((diff / comparacionData.horasPlanificadas) * 100).toFixed(0) : null;
                                            return (
                                                <div className="mt-1.5 text-[10px] border-t border-white/5 pt-1.5">
                                                    <div className="flex items-center justify-between text-gray-400">
                                                        <span>Anterior: <span className="text-amber-400 font-bold">{comparacionData.horasPlanificadas.toFixed(1).replace(/\.0$/, '')}h</span></span>
                                                        {pct !== null && (
                                                            <span className={`font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {diff >= 0 ? '+' : ''}{pct}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Trabajadas (registro) */}
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Trabajadas</span>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-xl font-black text-emerald-400">
                                                {informeData.horasTrabajadas.toFixed(1).replace(/\.0$/, '')}h
                                            </span>
                                            <span className="text-[10px] text-gray-500 mb-0.5">{informeData.totalRegistros} reg.</span>
                                        </div>
                                        {showComparacion && comparacionData && (() => {
                                            const diff = informeData.horasTrabajadas - comparacionData.horasTrabajadas;
                                            const pct = comparacionData.horasTrabajadas > 0 ? ((diff / comparacionData.horasTrabajadas) * 100).toFixed(0) : null;
                                            return (
                                                <div className="mt-1.5 text-[10px] border-t border-white/5 pt-1.5">
                                                    <div className="flex items-center justify-between text-gray-400">
                                                        <span>Anterior: <span className="text-amber-400 font-bold">{comparacionData.horasTrabajadas.toFixed(1).replace(/\.0$/, '')}h</span></span>
                                                        {pct !== null && (
                                                            <span className={`font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {diff >= 0 ? '+' : ''}{pct}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Pendientes */}
                                    {informeData.horasPendientes > 0 && (
                                        <div className="p-3 bg-black/20 rounded-xl border border-amber-500/20">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Pendientes</span>
                                            </div>
                                            <div className="flex items-end gap-1.5">
                                                <span className="text-xl font-black text-amber-400">
                                                    {informeData.horasPendientes.toFixed(1).replace(/\.0$/, '')}h
                                                </span>
                                                <span className="text-[10px] text-gray-500 mb-0.5">por revisar</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {showAusencias && (
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <CalendarOff className="w-3.5 h-3.5 text-rose-400" />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Ausencias</span>
                                    </div>
                                    <div className="flex items-end gap-1.5">
                                        <span className="text-xl font-black text-rose-400">{informeData.ausencias}</span>
                                        <span className="text-[10px] text-gray-500 mb-0.5">registradas</span>
                                    </div>
                                    {informeData.ausenciasPendientes > 0 && (
                                        <p className="text-[10px] text-amber-500/60 mt-1">
                                            {informeData.ausenciasPendientes} pendiente{informeData.ausenciasPendientes > 1 ? 's' : ''}
                                        </p>
                                    )}
                                    {showComparacion && comparacionData && (() => {
                                        const diff = informeData.ausencias - comparacionData.ausencias;
                                        return (
                                            <div className="mt-1.5 text-[10px] border-t border-white/5 pt-1.5">
                                                <div className="flex items-center justify-between text-gray-400">
                                                    <span>Anterior: <span className="text-amber-400 font-bold">{comparacionData.ausencias}</span></span>
                                                    {comparacionData.ausencias > 0 && (
                                                        <span className={`font-bold ${diff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {diff >= 0 ? '+' : ''}{diff}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {showEquipos && (
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Equipos</span>
                                    </div>
                                    <div className="flex items-end gap-1.5">
                                        <span className="text-xl font-black text-cyan-300">{informeData.equipos}</span>
                                        <span className="text-[10px] text-gray-500 mb-0.5">proyectos</span>
                                    </div>
                                </div>
                            )}

                            {showComparacion && comparacionData && prevPeriodLabel && (
                                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-center">
                                    <p className="text-[9px] text-amber-400/70 uppercase tracking-wider font-bold">Comparando con</p>
                                    <p className="text-[10px] text-amber-300 font-medium mt-0.5">{prevPeriodLabel}</p>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {informeData && (
                        <button onClick={generatePDF}
                            className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-3 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] cursor-pointer mt-1">
                            <Download className="w-3.5 h-3.5" />
                            Generar Informe
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
