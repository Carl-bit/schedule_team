import { useState, useEffect, useCallback } from 'react';

export interface UserData {
    empleado_id: string;
    nombre_empleado: string;
    alias_empleado: string;
    correo_empleado: string;
    telefono_empleado: string;
    puesto_empleado_id: string;
    puesto_empleado: string;
}

function parseUserData(): UserData | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('user_data');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function useUser() {
    const [user, setUser] = useState<UserData | null>(null);

    const refresh = useCallback(() => {
        setUser(parseUserData());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { user, refresh };
}
