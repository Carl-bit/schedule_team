export function formatearHora(fechaStr: string): string {
    return new Date(fechaStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function formatearFechaCorta(fechaStr: string): string {
    const date = new Date(fechaStr);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaTurno = new Date(date);
    fechaTurno.setHours(0, 0, 0, 0);

    if (fechaTurno.getTime() === hoy.getTime()) return 'Hoy';

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    if (fechaTurno.getTime() === manana.getTime()) return 'Mañana';

    return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function formatDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

export function formatDateDMY(s: string): string {
    if (!s) return '—';
    const p = s.split('-');
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : s;
}

export function formatTime(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
