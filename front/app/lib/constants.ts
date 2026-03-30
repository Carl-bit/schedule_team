export const ESTADO = {
    PENDIENTE: 1,
    APROBADO: 2,
    CORRECCION: 3,
    EN_REVISION: 4,
    RECHAZADO: 5,
} as const;

export type EstadoId = 1 | 2 | 3 | 4 | 5;

export interface EstadoStyle {
    label: string;
    color: string;
    bg: string;
    border: string;
    barColor: string;
}

export function getEstadoStyle(estadoId: number): EstadoStyle {
    switch (estadoId) {
        case ESTADO.PENDIENTE:
            return { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', barColor: 'bg-amber-500' };
        case ESTADO.APROBADO:
            return { label: 'Aprobado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', barColor: 'bg-emerald-500' };
        case ESTADO.CORRECCION:
            return { label: 'Corrección', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', barColor: 'bg-orange-500' };
        case ESTADO.EN_REVISION:
            return { label: 'En Revisión', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', barColor: 'bg-sky-500' };
        case ESTADO.RECHAZADO:
            return { label: 'Rechazado', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', barColor: 'bg-red-500' };
        default:
            return { label: 'Desconocido', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', barColor: 'bg-gray-500' };
    }
}

export const ESTADO_COBERTURA_STYLES: Record<string, { label: string; color: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-amber-500/20 text-amber-400' },
    aceptada: { label: 'Aceptada', color: 'bg-emerald-500/20 text-emerald-400' },
    rechazada: { label: 'Rechazada', color: 'bg-red-500/20 text-red-400' },
};
