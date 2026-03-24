import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus,
  Clock, CheckCircle2, AlertCircle, Calendar,
  X, Layers, Undo2, Save, Tag, Trash2, Pencil
} from 'lucide-react';

// --- TIPOS ---
type ShiftType = 'work' | 'replacement' | 'vacation' | 'medical_leave' | 'admin_day' | 'dayoff' | 'pattern';

const isAbsenceType = (type: ShiftType) => ['vacation', 'medical_leave', 'admin_day', 'dayoff'].includes(type);

interface ShiftLabel {
  id: string;
  name: string;
  timeRange: string;
  color: string;
  type: ShiftType;
  // Secuencia de turnos (identificadores de etiquetas) o turnos generados al vuelo
  patternSequence?: (string | null)[];
}

type EstadoId = 1 | 2 | 3 | 4 | 5;

interface AssignedShift {
  id: string;
  dateStr: string;
  labelId: string;
  estadoId: EstadoId;
  source: 'plan' | 'registro' | 'ausencia' | 'cobertura';
}

const getEstadoInfo = (estadoId: EstadoId) => {
  switch (estadoId) {
    case 1: return { label: 'Pendiente', color: 'text-amber-400', border: 'border-amber-500/60' };
    case 2: return { label: 'Aprobado', color: 'text-emerald-400', border: 'border-emerald-500/60' };
    case 3: return { label: 'Solicitud de Corrección', color: 'text-orange-400', border: 'border-orange-500/60' };
    case 4: return { label: 'En Revisión', color: 'text-sky-400', border: 'border-sky-500/60' };
    case 5: return { label: 'Rechazado', color: 'text-red-400', border: 'border-red-500/60' };
    default: return { label: 'Desconocido', color: 'text-gray-400', border: 'border-gray-500/60' };
  }
};

const API_BASE = 'http://localhost:3000/api';

// Datos iniciales eliminados, ahora vienen de la BD
export default function CalendarPanel({ empleado_id = 'USER_ANA' }: { empleado_id?: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [labels, setLabels] = useState<ShiftLabel[]>([]);
  const [assignments, setAssignments] = useState<AssignedShift[]>([]);
  const [history, setHistory] = useState<AssignedShift[][]>([]);
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);

  // Estado Modales
  const [showPatternModal, setShowPatternModal] = useState<{ isOpen: boolean; startDateStr: string | null }>({ isOpen: false, startDateStr: null });
  const [applyDaysCount, setApplyDaysCount] = useState(7);
  const [applyStartWeek, setApplyStartWeek] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState<'label' | 'pattern'>('label');
  const [selectedDayDetails, setSelectedDayDetails] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  // Notificaciones y Confirmaciones
  const [notification, setNotification] = useState<{ isOpen: boolean, message: string, type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);

  // Estado para Crear Etiqueta/Patrón
  const [createData, setCreateData] = useState({
    name: '',
    timeRange: '00:00 - 00:00',
    type: 'work' as ShiftType,
    color: 'bg-teal-500' // default
  });

  // Semanas de 7 días (Lunes a Domingo) para el Patrón Multi-semana. ID vacío = Descanso
  const [patternWeeksData, setPatternWeeksData] = useState<string[][]>([Array(7).fill('')]);

  // View Toggle para la lista superior
  const [activeView, setActiveView] = useState<'labels' | 'patterns'>('labels');

  const [isLoading, setIsLoading] = useState(false);

  // 1. CARGA INICIAL DE DATOS
  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const timestamp = Date.now();
        const [planRes, horaRes, etiquetasRes, ausenciasRes, catAusRes, coberturasRes] = await Promise.all([
          fetch(`${API_BASE}/planificacion/${empleado_id}?t=${timestamp}`),
          fetch(`${API_BASE}/hora/${empleado_id}?t=${timestamp}`),
          fetch(`${API_BASE}/etiquetas/${empleado_id}?t=${timestamp}`),
          fetch(`${API_BASE}/ausencias/${empleado_id}?t=${timestamp}`).catch(() => null),
          fetch(`${API_BASE}/catalogos/ausencias?t=${timestamp}`).catch(() => null),
          fetch(`${API_BASE}/solicitudes/empleado/${empleado_id}?t=${timestamp}`).catch(() => null)
        ]);

        let allMapped: AssignedShift[] = [];
        let newVirtualLabels: ShiftLabel[] = [];

        // Cargar etiquetas de la base de datos
        let currentKnownLabels: ShiftLabel[] = [];
        if (etiquetasRes.ok) {
          const dbEtiquetas = await etiquetasRes.json();
          currentKnownLabels = dbEtiquetas.map((et: any) => ({
            id: et.etiqueta_id,
            name: et.nombre,
            timeRange: et.rango_horas,
            color: et.color,
            type: et.tipo,
            patternSequence: et.secuencia_patron
          }));
          setLabels(currentKnownLabels);
        }

        const findOrCreateLabel = (timeRangeStr: string, isRegistro: boolean, idRef: string) => {
          let matchingLabel = currentKnownLabels.find(l => l.timeRange === timeRangeStr && l.type === 'work');

          if (matchingLabel) return matchingLabel.id; // ¡Coincide con una etiqueta creada!

          // No coincide: creamos etiqueta de prueba para indicar que viene de la BD
          const virtualId = `VIRTUAL_${isRegistro ? 'REG' : 'PLAN'}_${idRef}`;
          const virtualLabel: ShiftLabel = {
            id: virtualId,
            name: isRegistro ? 'Registro (BD)' : 'Planificado (BD)',
            timeRange: timeRangeStr,
            color: isRegistro ? 'bg-emerald-600' : 'bg-cyan-600',
            type: 'work'
          };

          currentKnownLabels.push(virtualLabel);
          newVirtualLabels.push(virtualLabel);
          return virtualId;
        };

        if (planRes.ok) {
          const planData = await planRes.json();
          const mappedPlan = planData.map((item: any) => {
            const date = new Date(item.inicio_turno);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            const inicioH = date.getHours().toString().padStart(2, '0');
            const inicioM = date.getMinutes().toString().padStart(2, '0');

            let timeRangeStr = `${inicioH}:${inicioM} - ??:??`;
            if (item.fin_turno) {
              const finDate = new Date(item.fin_turno);
              const finH = finDate.getHours().toString().padStart(2, '0');
              const finM = finDate.getMinutes().toString().padStart(2, '0');
              timeRangeStr = `${inicioH}:${inicioM} - ${finH}:${finM}`;
            }

            const matchedLabelId = findOrCreateLabel(timeRangeStr, false, item.plan_id);

            return {
              id: item.plan_id,
              dateStr,
              labelId: matchedLabelId,
              estadoId: (item.estado_id || 1) as EstadoId,
              source: 'plan' as const
            };
          });
          allMapped = [...allMapped, ...mappedPlan];
        }

        if (horaRes.ok) {
          const horaData = await horaRes.json();
          const mappedHora = horaData.map((item: any) => {
            const date = new Date(item.inicio_trabajo);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            const inicioH = date.getHours().toString().padStart(2, '0');
            const inicioM = date.getMinutes().toString().padStart(2, '0');
            let timeRangeStr = `${inicioH}:${inicioM} - En curso`;

            if (item.fin_trabajo) {
              const finDate = new Date(item.fin_trabajo);
              const finH = finDate.getHours().toString().padStart(2, '0');
              const finM = finDate.getMinutes().toString().padStart(2, '0');
              timeRangeStr = `${inicioH}:${inicioM} - ${finH}:${finM}`;
            }

            const matchedLabelId = findOrCreateLabel(timeRangeStr, true, item.registro_id);

            return {
              id: item.registro_id,
              dateStr: dateStr,
              labelId: matchedLabelId,
              estadoId: (item.estado_id || 1) as EstadoId,
              source: 'registro' as const
            };
          });
          allMapped = [...allMapped, ...mappedHora];
        }

        // --- Ausencias desde la BD ---
        if (ausenciasRes && ausenciasRes.ok) {
          try {
            const ausData = await ausenciasRes.json();
            if (Array.isArray(ausData)) {
              const mappedAus = ausData.map((aus: any) => {
                const inicioDate = new Date(aus.inicio_ausencia);
                const finDate = new Date(aus.fin_ausencia);
                const dateStr = `${inicioDate.getFullYear()}-${String(inicioDate.getMonth() + 1).padStart(2, '0')}-${String(inicioDate.getDate()).padStart(2, '0')}`;

                // Find matching ausencia label by motivo
                let matchedLabelId = currentKnownLabels.find(l =>
                  isAbsenceType(l.type) && l.name === aus.motivo
                )?.id;

                if (!matchedLabelId) {
                  // Create virtual label for the ausencia
                  const virtualId = `VIRTUAL_AUS_${aus.ausencia_id}`;
                  const virtualLabel: ShiftLabel = {
                    id: virtualId,
                    name: aus.motivo || 'Ausencia',
                    timeRange: 'Todo el día',
                    color: aus.requiere_aprobacion ? 'bg-red-500' : 'bg-sky-500',
                    type: aus.requiere_aprobacion ? 'vacation' : 'dayoff'
                  };
                  currentKnownLabels.push(virtualLabel);
                  newVirtualLabels.push(virtualLabel);
                  matchedLabelId = virtualId;
                }

                // For multi-day ausencias, create one entry per day
                const entries: AssignedShift[] = [];
                const current = new Date(inicioDate);
                while (current <= finDate) {
                  const ds = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                  entries.push({
                    id: `${aus.ausencia_id}_${ds}`,
                    dateStr: ds,
                    labelId: matchedLabelId,
                    estadoId: (aus.estado_id || 1) as EstadoId,
                    source: 'ausencia' as const
                  });
                  current.setDate(current.getDate() + 1);
                }
                return entries;
              }).flat();
              allMapped = [...allMapped, ...mappedAus];
            }
          } catch (e) {
            console.error('Error parsing ausencias:', e);
          }
        }

        // --- Solicitudes de Cobertura ---
        if (coberturasRes && coberturasRes.ok) {
          try {
            const cobData = await coberturasRes.json();
            if (Array.isArray(cobData)) {
              // Solo mostrar pendientes y aceptadas (no rechazadas)
              const relevantCob = cobData.filter((c: any) => c.estado === 'pendiente' || c.estado === 'aceptada');
              const mappedCob = relevantCob.map((cob: any) => {
                const inicioDate = new Date(cob.fecha_inicio);
                const finDate = new Date(cob.fecha_fin);

                // Virtual label for cobertura
                const isPending = cob.estado === 'pendiente';
                const virtualId = `VIRTUAL_COB_${cob.solicitud_id}`;
                const virtualLabel: ShiftLabel = {
                  id: virtualId,
                  name: isPending ? `Reemplazo (pendiente)` : `Reemplazo`,
                  timeRange: 'Todo el día',
                  color: isPending ? 'bg-violet-500' : 'bg-purple-600',
                  type: 'replacement'
                };
                if (!currentKnownLabels.find(l => l.id === virtualId)) {
                  currentKnownLabels.push(virtualLabel);
                  newVirtualLabels.push(virtualLabel);
                }

                // Create one entry per day in the range
                const entries: AssignedShift[] = [];
                const current = new Date(inicioDate);
                while (current <= finDate) {
                  const ds = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                  entries.push({
                    id: `COB_${cob.solicitud_id}_${ds}`,
                    dateStr: ds,
                    labelId: virtualId,
                    estadoId: (isPending ? 1 : 2) as EstadoId,
                    source: 'cobertura' as const
                  });
                  current.setDate(current.getDate() + 1);
                }
                return entries;
              }).flat();
              allMapped = [...allMapped, ...mappedCob];
            }
          } catch (e) {
            console.error('Error parsing coberturas:', e);
          }
        }

        if (newVirtualLabels.length > 0) {
          setLabels(prev => {
            const map = new Map(prev.map(l => [l.id, l]));
            newVirtualLabels.forEach(l => map.set(l.id, l));
            return Array.from(map.values());
          });
        }

        setAssignments(allMapped);
        setHistory([]);
      } catch (err) {
        console.error("Error cargando planificación u horas", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [empleado_id]);


  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const yearName = currentDate.getFullYear();

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getDayOfWeekIndex = (date: Date) => {
    let day = date.getDay() - 1;
    if (day === -1) day = 6;
    return day;
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = getDayOfWeekIndex(firstDay);
    const startDate = addDays(firstDay, -startDayOfWeek);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDay = addDays(startDate, i);
      days.push({
        dateObj: currentDay,
        dayNumber: currentDay.getDate(),
        isCurrentMonth: currentDay.getMonth() === month,
        dateStr: formatDateStr(currentDay),
        isToday: formatDateStr(currentDay) === formatDateStr(new Date())
      });
    }
    return days;
  }, [currentDate]);

  const activeLabel = labels.find(l => l.id === activeLabelId);

  // Filtrado de etiquetas para las vistas
  const regularLabels = labels.filter(l => l.type !== 'pattern' && !l.id.startsWith('VIRTUAL_'));
  const patternLabels = labels.filter(l => l.type === 'pattern' && !l.id.startsWith('VIRTUAL_'));

  // Historial helper
  const updateAssignmentsState = (newAssignments: AssignedShift[]) => {
    setHistory([...history, assignments]);
    setAssignments(newAssignments);
  };

  const handleDayClick = (dateStr: string) => {
    if (!activeLabelId) {
      // Si no hay etiqueta activa para asignar, y el día tiene eventos, mostrar modal de detalles
      const dayAssig = assignments.filter(a => a.dateStr === dateStr);
      if (dayAssig.length > 0) {
        setSelectedDayDetails(dateStr);
      }
      return;
    }

    if (!activeLabel) return;

    if (activeLabel.type === 'pattern') {
      setShowPatternModal({ isOpen: true, startDateStr: dateStr });
    } else {
      const newAssignments = [...assignments];
      const existingPlanIndex = newAssignments.findIndex(a => a.dateStr === dateStr && a.source === 'plan');

      if (existingPlanIndex >= 0) {
        if (newAssignments[existingPlanIndex].labelId === activeLabel.id) {
          // Si hace clic en la misma etiqueta, se elimina el turno de ese día
          newAssignments.splice(existingPlanIndex, 1);
        } else {
          // Si es otra etiqueta distinta, reemplaza y actualiza manteniendo su ID
          newAssignments[existingPlanIndex] = { ...newAssignments[existingPlanIndex], labelId: activeLabel.id, estadoId: 1 as EstadoId };
        }
      } else {
        newAssignments.push({
          // eslint-disable-next-line react-hooks/purity
          id: Math.random().toString(36).substring(7),
          dateStr,
          labelId: activeLabel.id,
          estadoId: 1 as EstadoId,
          source: 'plan'
        });
      }
      updateAssignmentsState(newAssignments);
    }
  };

  const applyPattern = () => {
    if (!showPatternModal.startDateStr || !activeLabel || activeLabel.type !== 'pattern' || !activeLabel.patternSequence) return;

    const startDateParts = showPatternModal.startDateStr.split('-');
    const startDate = new Date(parseInt(startDateParts[0]), parseInt(startDateParts[1]) - 1, parseInt(startDateParts[2]), 12, 0, 0);
    const totalDays = applyDaysCount;

    const newAssignments = [...assignments];
    const totalSequenceLength = activeLabel.patternSequence.length;
    const startDayOfWeek = getDayOfWeekIndex(startDate);
    const startWeekOffset = (applyStartWeek - 1) * 7;

    for (let i = 0; i < totalDays; i++) {
      const currentProcessingDate = addDays(startDate, i);
      const seqIdx = (i + startDayOfWeek + startWeekOffset) % totalSequenceLength;
      const labelIdForDay = activeLabel.patternSequence[seqIdx];

      if (labelIdForDay) {
        const dateStr = formatDateStr(currentProcessingDate);
        const existingPlanIndex = newAssignments.findIndex(a => a.dateStr === dateStr && a.source === 'plan');

        if (existingPlanIndex >= 0) {
          if (newAssignments[existingPlanIndex].labelId !== labelIdForDay) {
            newAssignments[existingPlanIndex] = {
              ...newAssignments[existingPlanIndex],
              labelId: labelIdForDay,
              estadoId: 1 as EstadoId
            };
          }
        } else {
          newAssignments.push({
            // eslint-disable-next-line react-hooks/purity
            id: Math.random().toString(36).substring(7),
            dateStr,
            labelId: labelIdForDay,
            estadoId: 1 as EstadoId,
            source: 'plan'
          });
        }
      }
    }

    updateAssignmentsState(newAssignments);
    setShowPatternModal({ isOpen: false, startDateStr: null });
    setActiveLabelId(null);
    setApplyStartWeek(1);
    setApplyDaysCount(7);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setAssignments(previous);
      setHistory(history.slice(0, -1));
    }
  };

  const handleSave = async () => {
    try {
      // Separar asignaciones: work/replacement → planificacion, vacation/unavailable → ausencias
      const planAssignments = assignments.filter(a => {
        if (a.source === 'registro' || a.source === 'ausencia') return false;
        const l = labels.find(lb => lb.id === a.labelId);
        return l && !isAbsenceType(l.type);
      });

      const ausenciaAssignments = assignments.filter(a => {
        if (a.source === 'registro') return false;
        const l = labels.find(lb => lb.id === a.labelId);
        return l && isAbsenceType(l.type);
      });

      // --- 1. Guardar planificaciones (solo work/replacement) ---
      const turnosBulk = planAssignments.map(a => {
        const l = labels.find(lb => lb.id === a.labelId);

        let hhInicio = 9; let minInicio = 0;
        let hhFin = 18; let minFin = 0;

        if (l && l.timeRange && l.timeRange !== 'Todo el día' && l.timeRange.includes('-')) {
          const parts = l.timeRange.split('-');
          const horaI = parts[0].trim().split(':');
          const horaF = parts[1].trim().split(':');

          const parsedHInicio = parseInt(horaI[0]);
          const parsedMInicio = parseInt(horaI[1] || '0');
          const parsedHFin = parseInt(horaF[0]);
          const parsedMFin = parseInt(horaF[1] || '0');

          if (!isNaN(parsedHInicio)) hhInicio = parsedHInicio;
          if (!isNaN(parsedMInicio)) minInicio = parsedMInicio;
          if (!isNaN(parsedHFin)) hhFin = parsedHFin;
          if (!isNaN(parsedMFin)) minFin = parsedMFin;
        }

        const dateParts = a.dateStr.split('-');
        const y = parseInt(dateParts[0]); const m = parseInt(dateParts[1]) - 1; const d = parseInt(dateParts[2]);

        const inicio = new Date(y, m, d, hhInicio, minInicio, 0);
        const fin = new Date(y, m, d, hhFin, minFin, 0);

        if (fin < inicio) {
          fin.setDate(fin.getDate() + 1);
        }

        const pad = (n: number) => String(n).padStart(2, '0');
        const toLocalISOString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

        return {
          plan_id: a.id,
          inicio_turno: !isNaN(inicio.getTime()) ? toLocalISOString(inicio) : toLocalISOString(new Date()),
          fin_turno: !isNaN(fin.getTime()) ? toLocalISOString(fin) : toLocalISOString(new Date()),
          estado_id: a.estadoId
        };
      });

      // --- 2. Guardar ausencias (vacation/unavailable) ---
      // Agrupar por labelId para crear ausencias con rango de fechas
      const ausenciasByLabel = new Map<string, string[]>();
      ausenciaAssignments.forEach(a => {
        if (!ausenciasByLabel.has(a.labelId)) ausenciasByLabel.set(a.labelId, []);
        ausenciasByLabel.get(a.labelId)!.push(a.dateStr);
      });

      // Fetch catalogo_ausencias para mapear tipo
      let catAus: any[] = [];
      try {
        const catRes = await fetch(`${API_BASE}/catalogos/ausencias`);
        if (catRes.ok) catAus = await catRes.json();
      } catch (e) { console.error('Error fetching catalogo_ausencias:', e); }

      const ausenciaPromises: Promise<any>[] = [];
      ausenciasByLabel.forEach((dates, labelId) => {
        const label = labels.find(l => l.id === labelId);
        if (!label) return;

        // Buscar tipo_ausencia_id en catálogo por tipo exacto
        const tipoMapping: Record<string, string[]> = {
          'vacation': ['vacacion'],
          'medical_leave': ['licencia', 'médica', 'medica'],
          'admin_day': ['administrativo'],
          'dayoff': ['libre', 'día libre', 'dia libre']
        };

        const searchTerms = tipoMapping[label.type] || [];
        let tipoId = catAus.find((c: any) =>
          searchTerms.some(term => c.descripcion?.toLowerCase().includes(term))
        )?.tipo_id;

        // Fallback: buscar por nombre exacto de la etiqueta
        if (!tipoId) {
          tipoId = catAus.find((c: any) =>
            c.descripcion?.toLowerCase().includes(label.name.toLowerCase())
          )?.tipo_id || catAus[0]?.tipo_id;
        }

        if (!tipoId) {
          console.warn('No se encontró tipo_ausencia_id para:', label.name);
          return;
        }

        // Ordenar fechas y agrupar en rangos continuos
        const sortedDates = [...dates].sort();
        const ranges: { inicio: string; fin: string }[] = [];
        let rangeStart = sortedDates[0];
        let rangePrev = sortedDates[0];

        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(rangePrev);
          const currDate = new Date(sortedDates[i]);
          const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);

          if (diffDays > 1) {
            ranges.push({ inicio: rangeStart, fin: rangePrev });
            rangeStart = sortedDates[i];
          }
          rangePrev = sortedDates[i];
        }
        ranges.push({ inicio: rangeStart, fin: rangePrev });

        // Crear una ausencia por cada rango continuo
        ranges.forEach(range => {
          ausenciaPromises.push(
            fetch(`${API_BASE}/ausencias`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                empleado_id: empleado_id,
                tipo_ausencia_id: tipoId,
                inicio: `${range.inicio}T00:00:00`,
                fin: `${range.fin}T23:59:59`
              })
            })
          );
        });
      });

      // Ejecutar ambos en paralelo
      const results = await Promise.all([
        turnosBulk.length > 0
          ? fetch(`${API_BASE}/planificacion/bulk/${empleado_id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ turnos: turnosBulk })
            })
          : Promise.resolve({ ok: true }),
        ...ausenciaPromises
      ]);

      const allOk = results.every((r: any) => r.ok !== false);

      if (allOk) {
        const msgs: string[] = [];
        if (turnosBulk.length > 0) msgs.push(`${turnosBulk.length} turnos`);
        if (ausenciaPromises.length > 0) msgs.push(`${ausenciaPromises.length} ausencia(s)`);
        setNotification({ isOpen: true, message: `Guardado: ${msgs.join(' y ')} registrado(s) correctamente.`, type: 'success' });
        setHistory([]);
        window.dispatchEvent(new Event('scheduleUpdated'));
      } else {
        setNotification({ isOpen: true, message: "Ocurrió un error guardando. Revisa la consola.", type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ isOpen: true, message: "Error de conexión guardando horario", type: 'error' });
    }
  };

  const handleDeleteLabel = async (labelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar seleccionar la etiqueta
    setConfirmDialog({
      isOpen: true,
      message: "¿Estás seguro de que quieres eliminar esta etiqueta/patrón? Los turnos ya asignados en el calendario que usen esta etiqueta también se eliminarán.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/etiquetas/${labelId}?empleado_id=${empleado_id}`, {
            method: 'DELETE'
          });

          if (res.ok) {
            // Si estaba seleccionada, limpiar selección
            if (activeLabelId === labelId) setActiveLabelId(null);

            // Eliminar de las etiquetas
            const updatedLabels = labels.filter(l => l.id !== labelId);
            setLabels(updatedLabels);

            // Eliminar del calendario (como es destructivo, lo agregamos al historial)
            const newAssignments = assignments.filter(a => a.labelId !== labelId);
            if (newAssignments.length !== assignments.length) {
              updateAssignmentsState(newAssignments);
            }
            setNotification({ isOpen: true, message: "Etiqueta eliminada con éxito.", type: 'success' });
          } else {
            setNotification({ isOpen: true, message: "Error al eliminar etiqueta.", type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setNotification({ isOpen: true, message: "Error de red al eliminar etiqueta.", type: 'error' });
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleCloseRegistro = async (registroId: string, dateStr: string) => {
    try {
      const inputEl = document.getElementById(`close-time-${registroId}`) as HTMLInputElement;
      const timeVal = inputEl ? inputEl.value : '17:00';
      const finTrabajo = `${dateStr}T${timeVal}:00`;

      const res = await fetch(`${API_BASE}/hora/${registroId}/cerrar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fin_trabajo: finTrabajo })
      });
      if (!res.ok) throw new Error("Error al cerrar registro manually");

      setNotification({ type: 'success', message: '¡Turno cerrado y guardado correctamente!', isOpen: true });
      window.dispatchEvent(new Event('scheduleUpdated'));

      const newAssignments = assignments.map(a => {
        if (a.id === registroId) {
          return { ...a, estadoId: 2 as EstadoId };
        }
        return a;
      });
      updateAssignmentsState(newAssignments);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'No se pudo cerrar el turno.', isOpen: true });
    }
  };

  const handleDeleteAssignment = (assignment: AssignedShift, event: React.MouseEvent) => {
    event.stopPropagation();
    if (assignment.source !== 'plan' && assignment.source !== 'ausencia') return;

    const isAus = assignment.source === 'ausencia';
    const msg = isAus
      ? "¿Estás seguro de que quieres eliminar esta ausencia?"
      : "¿Estás seguro de que quieres eliminar este turno del día seleccionado?";

    setConfirmDialog({
      isOpen: true,
      message: msg,
      onConfirm: async () => {
        try {
          let res;
          if (isAus) {
            // Para ausencias, el ID tiene formato "ausencia_id_dateStr" — extraer el ausencia_id real
            const ausenciaId = assignment.id.includes('_') ? assignment.id.split('_').slice(0, -3).join('_') || assignment.id.substring(0, assignment.id.lastIndexOf('_' + assignment.dateStr.split('-')[0])) : assignment.id;
            // Intentar extraer el UUID correcto (todo antes del último _YYYY-MM-DD)
            const lastDateIdx = assignment.id.lastIndexOf('_' + assignment.dateStr);
            const realId = lastDateIdx > 0 ? assignment.id.substring(0, lastDateIdx) : assignment.id;
            res = await fetch(`${API_BASE}/ausencias/${realId}`, { method: 'DELETE' });

            if (res.ok) {
              // Eliminar TODAS las entradas de esta ausencia (puede ser multi-día)
              const newAssignments = assignments.filter(a => !a.id.startsWith(realId + '_'));
              updateAssignmentsState(newAssignments);

              if (newAssignments.filter(a => a.dateStr === selectedDayDetails).length === 0) {
                setSelectedDayDetails(null);
              }

              setNotification({ isOpen: true, message: "Ausencia eliminada correctamente.", type: 'success' });
              window.dispatchEvent(new Event('scheduleUpdated'));
            } else {
              setNotification({ isOpen: true, message: "Error al eliminar la ausencia.", type: 'error' });
            }
          } else {
            res = await fetch(`${API_BASE}/planificacion/${assignment.id}`, { method: 'DELETE' });

            if (res.ok || res.status === 404 || res.status === 400 || res.status === 500) {
              const newAssignments = assignments.filter(a => a.id !== assignment.id);
              updateAssignmentsState(newAssignments);

              if (newAssignments.filter(a => a.dateStr === selectedDayDetails).length === 0) {
                setSelectedDayDetails(null);
              }

              setNotification({ isOpen: true, message: "Turno eliminado del calendario.", type: 'success' });
              window.dispatchEvent(new Event('scheduleUpdated'));
            } else {
              setNotification({ isOpen: true, message: "Error al borrar en la Base de Datos.", type: 'error' });
            }
          }
        } catch (err) {
          console.error(err);
          const newAssignments = assignments.filter(a => a.id !== assignment.id);
          updateAssignmentsState(newAssignments);
          setNotification({ isOpen: true, message: "Eliminado localmente (Error DB).", type: 'success' });
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const openEditModal = (label: ShiftLabel, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingLabelId(label.id);

    if (label.type === 'pattern') {
      setCreateTab('pattern');
      setCreateData({ name: label.name, timeRange: label.timeRange, type: 'pattern', color: label.color });
      // Cargar secuencia original o llenar con vacíos y agrupar en pedazos de 7
      const seq = label.patternSequence || Array(7).fill(null);
      const reshaped: string[][] = [];
      for (let i = 0; i < seq.length; i += 7) {
        reshaped.push((seq.slice(i, i + 7) as (string | null)[]).map(id => id ? id : ''));
      }
      setPatternWeeksData(reshaped);
    } else {
      setCreateTab('label');
      setCreateData({ name: label.name, timeRange: label.timeRange, type: label.type, color: label.color });
    }
    setShowCreateModal(true);
  };

  const handleCreateLabel = async () => {
    if (!createData.name) return;

    const newLabelsList = [...labels];

    if (createTab === 'label') {
      const newLabel: ShiftLabel = {
        id: editingLabelId ? editingLabelId : Math.random().toString(36).substring(7),
        name: createData.name,
        timeRange: createData.timeRange,
        type: createData.type,
        color: createData.color
      };

      if (editingLabelId) {
        const index = newLabelsList.findIndex(l => l.id === editingLabelId);
        if (index > -1) newLabelsList[index] = newLabel;
      } else {
        newLabelsList.push(newLabel);
      }
    } else {
      const sequence: (string | null)[] = patternWeeksData.flat().map(id => id === '' ? null : id);

      const patternLabel: ShiftLabel = {
        id: editingLabelId ? editingLabelId : Math.random().toString(36).substring(7),
        name: createData.name,
        timeRange: 'Patrón Compuesto',
        type: 'pattern',
        color: createData.color,
        patternSequence: sequence.length ? sequence : [null]
      };

      if (editingLabelId) {
        const index = newLabelsList.findIndex(l => l.id === editingLabelId);
        if (index > -1) newLabelsList[index] = patternLabel;
      } else {
        newLabelsList.push(patternLabel);
      }
    }

    // Determine target label just processed to send to DB
    const processedLabel = newLabelsList.find(l =>
      (editingLabelId && l.id === editingLabelId) ||
      (!editingLabelId && l.name === createData.name && l.timeRange === (createTab === 'label' ? createData.timeRange : 'Patrón Compuesto'))
    );

    if (processedLabel) {
      try {
        const url = editingLabelId ? `${API_BASE}/etiquetas/${processedLabel.id}` : `${API_BASE}/etiquetas`;
        const method = editingLabelId ? 'PUT' : 'POST';

        const payload = {
          etiqueta_id: processedLabel.id,
          empleado_id: empleado_id,
          nombre: processedLabel.name,
          rango_horas: processedLabel.timeRange,
          color: processedLabel.color,
          tipo: processedLabel.type,
          secuencia_patron: processedLabel.patternSequence
        };

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          setNotification({ isOpen: true, message: "Error al guardar etiqueta en DB.", type: 'error' });
          return; // Prevent updating UI if DB fails
        }
      } catch (err) {
        console.error("Error al persistir etiqueta:", err);
        setNotification({ isOpen: true, message: "Error de red al guardar etiqueta.", type: 'error' });
        return;
      }
    }

    setLabels(newLabelsList);
    setShowCreateModal(false);
    setEditingLabelId(null);
    // Reset Modal state
    setCreateData({ name: '', timeRange: '', type: 'work', color: 'bg-teal-500' });
    setPatternWeeksData([Array(7).fill('')]);
  };

  const getColorButtonClasses = (colorClass: string, isSelected: boolean) => {
    return `w - 6 h - 6 rounded - full cursor - pointer transition - transform ${colorClass} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e2024] scale-110' : 'hover:scale-110'} `;
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#0f1115]/80 backdrop-blur-md border border-gray-800/60 rounded-xl overflow-hidden font-sans text-gray-200 shadow-[0_0_40px_rgba(0,0,0,0.5)]">

      {/* HEADER */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center p-4 border-b border-gray-800/80 bg-black/20">

        <div className="flex flex-col justify-self-start">
          <h2 className="text-xl font-bold capitalize text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Calendario de Turnos
          </h2>
          <p className="text-sm text-gray-400">Planifica tus horarios y reemplazos.</p>
        </div>

        <div className="flex items-center justify-center justify-self-center bg-[#1e2024]/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-700/50 shadow-xl">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-700/80 rounded-lg transition-colors cursor-pointer"><ChevronLeft className="w-6 h-6 text-gray-300" /></button>
          <span className="min-w-[180px] text-center font-bold text-white capitalize text-lg tracking-wide select-none">
            {monthName} {yearName}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-700/80 rounded-lg transition-colors cursor-pointer"><ChevronRight className="w-6 h-6 text-gray-300" /></button>
        </div>

        <div className="flex justify-end justify-self-end">
          <button
            onClick={() => { setShowCreateModal(true); setEditingLabelId(null); setCreateTab('label'); setCreateData({ name: '', timeRange: '', type: 'work', color: 'bg-teal-500' }); setPatternWeeksData([Array(7).fill('')]); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-900/40 hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Patrón / Etiqueta
          </button>
        </div>

      </header>

      {/* TOP BAR: SEPARACIÓN DE ETIQUETAS Y PATRONES */}
      <div className="flex flex-col bg-black/20 border-b border-gray-800/60 shrink-0">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 pb-2 border-b border-gray-800/40">

          <div className="flex items-center gap-4">
            {/* View Toggles */}
            <div className="flex bg-[#16171a] p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => { setActiveView('labels'); setActiveLabelId(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeView === 'labels' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Tag className="w-4 h-4" /> Etiquetas
              </button>
              <button
                onClick={() => { setActiveView('patterns'); setActiveLabelId(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeView === 'patterns' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Layers className="w-4 h-4" /> Patrones
              </button>
            </div>

            {/* Indicator Text */}
            <div className={`
              transition-all duration-300 px-4 py-1.5 rounded-lg border font-bold text-sm shadow-md
              ${activeLabel
                ? `${activeLabel.color.replace('bg-', 'text-').replace('500', '300')} bg-gray-900/80 border-gray-700 scale-105`
                : 'text-gray-500 bg-transparent border-transparent'
              }
            `}>
              {activeLabel
                ? (activeLabel.type === 'pattern' ? `Aplicando patrón: ${activeLabel.name}` : `Seleccionado: ${activeLabel.name}`)
                : `Selecciona un${activeView === 'labels' ? 'a etiqueta' : ' patrón'} para asignar`}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200
                ${history.length > 0
                  ? 'border-gray-600 text-white hover:bg-gray-800 hover:border-gray-400 cursor-pointer shadow-md'
                  : 'border-transparent text-gray-600 bg-gray-800/30 cursor-not-allowed'
                }
              `}
            >
              <Undo2 className="w-4 h-4" /> Deshacer
            </button>

            <button
              onClick={handleSave}
              disabled={history.length === 0}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-lg
                ${history.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Save className="w-4 h-4" /> Guardar Horario
            </button>
          </div>
        </div>

        {/* LST OF ITEMS BASED ON ACTIVE VIEW */}
        <div className="p-4 pt-3 flex flex-wrap gap-3">
          {(activeView === 'labels' ? regularLabels : patternLabels).length === 0 && (
            <div className="text-sm text-gray-500 italic py-2">No tienes {activeView === 'labels' ? 'etiquetas' : 'patrones'} creados.</div>
          )}

          {(activeView === 'labels' ? regularLabels : patternLabels).map(label => {
            const isActive = activeLabelId === label.id;
            const isPattern = label.type === 'pattern';
            return (
              <div key={label.id} className="relative group">
                <button
                  onClick={() => setActiveLabelId(isActive ? null : label.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer w-[200px] h-full
                    ${isActive
                      ? `border-white/20 bg-black/40 shadow-[0_0_20px_rgba(0,0,0,0.4)] ring-1 ring-white/10 scale-105`
                      : 'border-gray-800/80 hover:border-gray-600 hover:bg-gray-800/40 bg-black/20'
                    }`}
                >
                  {isPattern ? (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${label.color} shadow-inner`}>
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <span className={`w-3.5 h-3.5 rounded-full shadow-sm ${label.color} ${isActive ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-black/50' : ''}`}></span>
                  )}

                  <div className="flex flex-col items-start px-1 leading-tight text-left overflow-hidden">
                    <span className={`text-[14px] font-bold truncate w-full ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {label.name}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 font-medium truncate w-full">
                      <Clock className="w-3 h-3 opacity-70 shrink-0" /> {label.timeRange}
                    </span>
                  </div>
                </button>

                {/* Botones de acción, aparece al hacer hover en el contenedor padre */}
                <div className="absolute -top-2 -right-2 flex gap-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEditModal(label, e)}
                    className="bg-indigo-500/90 text-white p-1.5 rounded-full shadow-lg border border-indigo-700 cursor-pointer hover:bg-indigo-400"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteLabel(label.id, e)}
                    className="bg-red-500/90 text-white p-1.5 rounded-full shadow-lg border border-red-700 cursor-pointer hover:bg-red-400"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA: CALENDAR + SIDEBAR */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative bg-transparent">

        {/* CALENDAR GRID COLUMN */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-gray-800/50">

          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 bg-[#1e2024] p-4 rounded-xl shadow-2xl border border-gray-700">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="text-sm font-bold text-gray-300">Cargando Horario...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-3 mb-3 shrink-0">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-black/30 py-2 rounded-lg border border-gray-800/50">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            {calendarDays.map((day, idx) => {
              const dayAssignments = assignments.filter(a => a.dateStr === day.dateStr);

              let cellBgClass = 'bg-[#1a1c20]/60';
              let borderColorClass = 'border-gray-800/50';

              if (dayAssignments.length === 1) {
                const l = labels.find(l => l.id === dayAssignments[0].labelId);
                if (l) {
                  // Fallback for colors: extract the base color name and weight to use with opacity
                  cellBgClass = `${l.color} bg-opacity-20`;
                  borderColorClass = `${l.color.replace('bg-', 'border-')} border-opacity-40`;
                }
              } else if (dayAssignments.length > 1) {
                cellBgClass = 'bg-gray-500 bg-opacity-20';
                borderColorClass = 'border-gray-500 border-opacity-50';
              }

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={`
                    flex flex-col p-2.5 rounded-xl min-h-[120px] transition-all duration-200 border
                    ${!day.isCurrentMonth ? 'opacity-40 hover:opacity-100' : ''}
                    ${day.isToday ? 'ring-2 ring-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : ''}
                    ${cellBgClass}
                    ${borderColorClass}
                    ${activeLabelId ? 'cursor-pointer hover:shadow-lg hover:brightness-125' : 'cursor-default'}
                    backdrop-blur-sm
                  `}
                >
                  <div className="flex justify-between items-start mb-2 shrink-0">
                    <span className={`text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full
                      ${day.isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-gray-300'}
                    `}>
                      {day.dayNumber}
                    </span>

                    <div className="flex gap-1.5 items-center">
                      {dayAssignments.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDetails(day.dateStr);
                          }}
                          title="Ver eventos del día"
                          className="text-[10px] text-indigo-200 hover:text-white font-bold bg-indigo-500/20 hover:bg-indigo-500/40 px-2 py-0.5 rounded border border-indigo-500/30 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Calendar className="w-3 h-3" />
                          {dayAssignments.length}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-auto overflow-y-auto w-full custom-scrollbar pt-1">
                    {dayAssignments.map(assignment => {
                      const labelInfo = labels.find(l => l.id === assignment.labelId);
                      if (!labelInfo) return null;

                      return (
                        <div key={assignment.id} className="relative group w-full shrink-0">
                          {(() => { const ei = getEstadoInfo(assignment.estadoId); return (
                          <div className={`
                            flex items-center gap-2 px-2 py-1.5 bg-black/50 rounded-lg border border-gray-700/60 shadow-sm
                            ${assignment.estadoId !== 2 ? `border-dashed ${ei.border} opacity-95` : 'border-solid'}
                            hover:border-gray-400 transition-colors backdrop-blur-md
                          `}>
                            <span className={`w-1.5 h-full absolute left-0 top-0 bottom-0 rounded-l-lg shrink-0 ${labelInfo.color} opacity-90`}></span>
                            <div className="flex flex-col overflow-hidden w-full pl-2">
                              <span className="text-[11px] font-bold text-gray-100 truncate leading-tight">{labelInfo.name}</span>
                              <span className="text-[9px] text-gray-300 truncate font-medium">{labelInfo.timeRange}</span>
                            </div>

                            <div className="ml-auto flex items-center shrink-0 pl-1 z-10 bg-black/40 rounded-full p-0.5">
                              <div title={ei.label} className="flex items-center justify-center">
                                {assignment.estadoId === 2 ? (
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${ei.color}`} />
                                ) : assignment.estadoId === 5 ? (
                                  <X className={`w-3.5 h-3.5 ${ei.color}`} />
                                ) : (
                                  <AlertCircle className={`w-3.5 h-3.5 ${ei.color}`} />
                                )}
                              </div>
                            </div>
                          </div>
                          ); })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL: APLICAR PATRÓN RECURSIVO */}
      {showPatternModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Aplicar Patrón
              </h3>
              <button onClick={() => setShowPatternModal({ isOpen: false, startDateStr: null })} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Seleccionaste el patrón <strong className="text-indigo-300">{activeLabel?.name}</strong> comenzando el día <strong className="text-white">{showPatternModal.startDateStr}</strong>.
            </p>

            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Semana de Inicio</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={Math.ceil((activeLabel?.patternSequence?.length || 7) / 7)}
                    value={applyStartWeek}
                    onChange={e => setApplyStartWeek(parseInt(e.target.value) || 1)}
                    className="w-20 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <span className="text-sm text-gray-400">
                    de {Math.ceil((activeLabel?.patternSequence?.length || 7) / 7)} semanas de rotación
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duración del Reemplazo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={applyDaysCount}
                    onChange={e => setApplyDaysCount(parseInt(e.target.value) || 1)}
                    className="w-20 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <span className="text-sm text-gray-400">días correlativos al ciclo</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-auto">
              <button
                onClick={() => setShowPatternModal({ isOpen: false, startDateStr: null })}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={applyPattern}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 cursor-pointer"
              >
                Aplicar Patrón
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVA ETIQUETA O PATRÓN */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {createTab === 'label' ? <Tag className="w-5 h-5 text-indigo-400" /> : <Layers className="w-5 h-5 text-indigo-400" />}
                {editingLabelId ? "Editar" : "Crear Nuevo"} {createTab === 'label' ? 'Horario' : 'Patrón'}
              </h3>
              <button onClick={() => { setShowCreateModal(false); setEditingLabelId(null); }} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Toggle */}
            <div className="flex gap-6 border-b border-gray-700 w-full mb-6 mt-4">
              <button
                onClick={() => !editingLabelId && setCreateTab('label')}
                disabled={!!editingLabelId && createTab !== 'label'}
                className={`pb-2 text-sm font-bold transition-all ${createTab === 'label' ? 'border-b-2 border-indigo-400 text-white' : 'text-gray-500 hover:text-gray-300'} ${editingLabelId && createTab !== 'label' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Etiqueta Simple
              </button>
              <button
                onClick={() => !editingLabelId && setCreateTab('pattern')}
                disabled={!!editingLabelId && createTab !== 'pattern'}
                className={`pb-2 text-sm font-bold transition-all ${createTab === 'pattern' ? 'border-b-2 border-indigo-400 text-white' : 'text-gray-500 hover:text-gray-300'} ${editingLabelId && createTab !== 'pattern' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Patrón Compuesto
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6 overflow-y-auto pr-2 custom-scrollbar shrink-1">
              {createTab === 'label' ? (
                <div className="max-w-md">
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-xs font-bold text-gray-400">Nombre de la Etiqueta</label>
                    <input
                      type="text" value={createData.name} onChange={e => setCreateData({ ...createData, name: e.target.value })}
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm" placeholder="Ej: Turno Especial"
                    />
                  </div>
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-xs font-bold text-gray-400">Rango de Horas</label>
                    <input
                      type="text" value={createData.timeRange} onChange={e => setCreateData({ ...createData, timeRange: e.target.value })}
                      disabled={isAbsenceType(createData.type)}
                      className={`bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm ${isAbsenceType(createData.type) ? 'opacity-50 cursor-not-allowed text-gray-500' : ''
                        }`} placeholder="00:00 - 00:00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400">Tipo</label>
                    <select
                      value={createData.type}
                      onChange={e => {
                        const newType = e.target.value as ShiftType;
                        let newTimeRange = createData.timeRange;

                        // Switch automatically to 'Todo el día' if it's an absence type
                        if (isAbsenceType(newType)) {
                          newTimeRange = 'Todo el día';
                        } else if (newTimeRange === 'Todo el día') {
                          newTimeRange = ''; // Reset standard input to empty to let them type
                        }

                        setCreateData({ ...createData, type: newType, timeRange: newTimeRange });
                      }}
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="work">Turno Trabajo</option>
                      <option value="replacement">Reemplazo</option>
                      <option value="vacation">Vacaciones</option>
                      <option value="medical_leave">Licencia Médica</option>
                      <option value="admin_day">Día Administrativo</option>
                      <option value="dayoff">Día Libre</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1 mb-2">
                    <label className="text-xs font-bold text-gray-400">Nombre del Patrón General</label>
                    <input
                      type="text" value={createData.name} onChange={e => setCreateData({ ...createData, name: e.target.value })}
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm max-w-md" placeholder="Ej: Rotativa Compleja"
                    />
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs font-bold text-gray-400 border-t border-gray-700/50 pt-4 mb-2">Asignación por Día de la Semana</label>

                    <div className="flex flex-col gap-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {patternWeeksData.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-2 p-3 bg-black/20 rounded-xl border border-gray-700/50 relative">
                          {patternWeeksData.length > 1 && (
                            <button onClick={() => {
                              const newArr = [...patternWeeksData];
                              newArr.splice(weekIdx, 1);
                              setPatternWeeksData(newArr);
                            }} className="absolute -top-3 -right-3 bg-red-500/80 hover:bg-red-500 p-1.5 rounded-full text-white shadow-lg cursor-pointer transition-colors z-10" title="Eliminar Rotación"><X className="w-4 h-4" /></button>
                          )}
                          <strong className="text-xs text-indigo-400 uppercase tracking-widest pl-1">Semana de Rotación {weekIdx + 1}</strong>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 mb-2">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName, dayIdx) => (
                              <div key={dayIdx} className="flex flex-col gap-1 w-full shrink-0">
                                <label className="text-[10px] font-bold text-indigo-300/60 uppercase">{dayName}</label>
                                <select
                                  value={week[dayIdx]}
                                  onChange={(e) => {
                                    const newArr = [...patternWeeksData];
                                    newArr[weekIdx] = [...newArr[weekIdx]];
                                    newArr[weekIdx][dayIdx] = e.target.value;
                                    setPatternWeeksData(newArr);
                                  }}
                                  className="bg-black/50 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs w-full max-w-full"
                                >
                                  <option value="">-- Libre --</option>
                                  {regularLabels.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setPatternWeeksData([...patternWeeksData, Array(7).fill('')])}
                      className="mt-2 flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-gray-600 text-gray-400 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Añadir Semana a la Rotación
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* SELECTOR DE COLOR COMÚN PARA AMBAS PESTAÑAS */}
            <div className="flex flex-col gap-2 mb-4 pt-4 border-t border-gray-700/50 shrink-0">
              <label className="text-xs font-bold text-gray-400">Color de la Etiqueta / Patrón</label>
              <div className="flex gap-3">
                {isAbsenceType(createData.type)
                  ? ['bg-red-600', 'bg-red-400', 'bg-orange-600', 'bg-orange-400', 'bg-blue-600', 'bg-sky-500'].map(c => (
                    <button key={c} onClick={() => setCreateData({ ...createData, color: c })} className={`w-8 h-8 rounded-full shadow-md ${c} ${createData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e2024] scale-110' : 'hover:scale-110'} transition-all cursor-pointer`} title="Seleccionar Color" />
                  ))
                  : ['bg-teal-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'].map(c => (
                    <button key={c} onClick={() => setCreateData({ ...createData, color: c })} className={`w-8 h-8 rounded-full shadow-md ${c} ${createData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e2024] scale-110' : 'hover:scale-110'} transition-all cursor-pointer`} title="Seleccionar Color" />
                  ))
                }
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-auto shrink-0 border-t border-gray-800 pt-4">
              <button onClick={() => { setShowCreateModal(false); setEditingLabelId(null); }} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:bg-gray-800 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleCreateLabel}
                disabled={createTab === 'label' ? !createData.name : (!createData.name || patternWeeksData.every(w => w.every(d => d === '')))}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-50 transition-all hover:scale-105 cursor-pointer"
              >
                {editingLabelId ? "Guardar Cambios" : `Crear ${createTab === 'label' ? 'Etiqueta' : 'Patrón'} `}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIONES */}
      {notification && notification.isOpen && (
        <div className="absolute bottom-4 right-4 z-[60] flex items-center gap-3 bg-[#1e2024] border border-gray-700 p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-8 fade-in transition-all">
          <div className={`p - 2 rounded - full ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'} `}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <span className="text-sm font-bold text-gray-200">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 text-gray-500 hover:text-white transition-colors cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DETALLES DEL DÍA SELECCIONADO (Modal) */}
      {selectedDayDetails && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Eventos del {new Date(selectedDayDetails + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
              {assignments.filter(a => a.dateStr === selectedDayDetails).map(assignment => {
                const labelInfo = labels.find(l => l.id === assignment.labelId);
                if (!labelInfo) return null;

                return (
                  <div key={'detail-' + assignment.id} className="relative flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-700/50 group hover:border-gray-500 transition-colors">
                    <span className={`absolute left - 0 top - 0 bottom - 0 w - 1.5 rounded - l - xl ${labelInfo.color} opacity - 90`}></span>

                    <div className="flex flex-col flex-1 pl-4">
                      <span className="text-sm font-bold text-white mb-0.5">{labelInfo.name}</span>
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400/80" />
                        {labelInfo.timeRange}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center">
                      {assignment.estadoId === 1 ? (
                        assignment.source === 'registro' ? (
                          <div className="flex items-center gap-2">
                            <input
                              id={`close-time-${assignment.id}`}
                              type="time"
                              defaultValue="17:00"
                              className="bg-[#1a1c20] text-gray-200 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-indigo-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCloseRegistro(assignment.id, assignment.dateStr); }}
                              className="text-xs font-bold px-2 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded border border-indigo-500/30 transition-colors"
                            >
                              Cerrar
                            </button>
                          </div>
                        ) : (
                          <div title="Pendiente" className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" /> Pendiente
                          </div>
                        )
                      ) : (() => {
                        const ei = getEstadoInfo(assignment.estadoId);
                        const bgMap: Record<number, string> = { 2: 'bg-emerald-500/10', 3: 'bg-orange-500/10', 4: 'bg-sky-500/10', 5: 'bg-red-500/10' };
                        const borderMap: Record<number, string> = { 2: 'border-emerald-500/20', 3: 'border-orange-500/20', 4: 'border-sky-500/20', 5: 'border-red-500/20' };
                        const IconComp = assignment.estadoId === 2 ? CheckCircle2 : assignment.estadoId === 5 ? X : AlertCircle;
                        return (
                          <div title={ei.label} className={`flex items-center gap-1.5 ${bgMap[assignment.estadoId] || 'bg-gray-500/10'} ${ei.color} px-2.5 py-1 rounded-full text-[10px] font-bold border ${borderMap[assignment.estadoId] || 'border-gray-500/20'}`}>
                            <IconComp className="w-3 h-3" /> {ei.label}
                          </div>
                        );
                      })()}

                      {(assignment.source === 'plan' || assignment.source === 'ausencia') && (
                        <button
                          title="Eliminar este turno"
                          onClick={(e) => handleDeleteAssignment(assignment, e)}
                          className="ml-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
              <button onClick={() => setSelectedDayDetails(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN (Modal) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Acción</h3>
            <p className="text-sm text-gray-400 mb-6">{confirmDialog.message}</p>
            <div className="flex w-full gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN (Toast/Modal) */}
      {notification && notification.isOpen && (
        <div className="fixed top-10 right-10 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${notification.type === 'success'
            ? 'bg-[#1e2e22]/90 border-emerald-500/50 text-emerald-400'
            : 'bg-[#311c1c]/90 border-red-500/50 text-red-400'
            }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-bold text-sm text-white pr-4">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      )}

      {/* Styled JSX */}
      <style dangerouslySetInnerHTML={{
        __html: `
  .custom - scrollbar:: -webkit - scrollbar { width: 5px; }
        .custom - scrollbar:: -webkit - scrollbar - track { background: transparent; }
        .custom - scrollbar:: -webkit - scrollbar - thumb { background: rgba(75, 85, 99, 0.6); border - radius: 10px; }
        .custom - scrollbar:: -webkit - scrollbar - thumb:hover { background: rgba(107, 114, 128, 0.9); }
`}} />
    </div>
  );
}