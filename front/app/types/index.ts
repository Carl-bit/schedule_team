// Empleado con todos los campos (vista completa)
export interface Empleado {
    empleado_id: string;
    nombre_empleado: string;
    alias_empleado: string;
    correo_empleado: string;
    telefono_empleado: string;
    puesto_empleado: string;
    puesto_empleado_id?: string;
}

export interface Proyecto {
    proyecto_id: string;
    nombre_proyecto: string;
    cliente: string;
    fecha_inicio: string;
    fecha_entrega: string | null;
}

export interface Asignacion {
    asignacion_id: string;
    empleado_id: string;
    nombre_empleado: string;
    proyecto_id: string;
    nombre_proyecto: string;
    cliente: string | null;
    fecha_inicio: string | null;
    fecha_entrega: string | null;
    rol_trabajo: string;
}

export interface Rol {
    rol_trabajo_id: string;
    rol_trabajo: string;
}

export interface Ausencia {
    ausencia_id: string;
    tipo_ausencia_id: string;
    motivo: string;
    requiere_aprobacion: boolean;
    inicio_ausencia: string;
    fin_ausencia: string;
    estado_id: number;
    motivo_revision?: string | null;
}

export interface SolicitudCobertura {
    solicitud_id: string;
    empleado_id: string;
    nombre_asignado: string;
    creado_por: string;
    nombre_lider: string;
    motivo: string;
    descripcion: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
    motivo_rechazo: string | null;
    created_at: string;
}
