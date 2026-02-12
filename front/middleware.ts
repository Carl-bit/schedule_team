import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {

    // 1. Intentamos leer la cookie llamada "user_role"
    // (Asumimos que guardaste 'lider' o 'trabajador' ahí al loguearse)
    const role = request.cookies.get('user_role')?.value;

    // 2. Si NO tiene rol (no se ha logueado), lo mandamos fuera
    if (!role) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Detectamos si está intentando entrar a la "Sala de Espera" (/dashboard)
    // request.nextUrl.pathname nos dice la ruta exacta
    if (request.nextUrl.pathname === '/dashboard') {

        if (role === 'lider') {
            return NextResponse.redirect(new URL('/dashboard/Lider', request.url));
        }

        if (role === 'trabajador') {
            return NextResponse.redirect(new URL('/dashboard/Trabajador', request.url));
        }
    }

    // 4. Si ya está en su ruta correcta, lo dejamos pasar
    return NextResponse.next();
}

// Configuración: El portero vigila todas las rutas que empiecen por /dashboard
export const config = {
    matcher: '/dashboard/:path*',
};