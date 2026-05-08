import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const role = request.cookies.get('user_role')?.value;
    const path = request.nextUrl.pathname;

    if (!role) {
        return NextResponse.redirect(new URL('/Login', request.url));
    }

    if (path === '/dashboard') {
        if (role === 'lider') return NextResponse.redirect(new URL('/dashboard/Lider', request.url));
        if (role === 'trabajador') return NextResponse.redirect(new URL('/dashboard/Trabajador', request.url));
    }

    // Bloqueo cruzado: trabajador no entra a /dashboard/Lider y viceversa
    if (path.startsWith('/dashboard/Lider') && role !== 'lider') {
        return NextResponse.redirect(new URL('/dashboard/Trabajador', request.url));
    }
    if (path.startsWith('/dashboard/Trabajador') && role !== 'trabajador') {
        return NextResponse.redirect(new URL('/dashboard/Lider', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};