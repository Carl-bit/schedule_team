'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const PRIMARY = '#7c3aed';
const SUCCESS = '#10b981';
const WARN = '#f59e0b';
const PINK_PURPLE = '#a855f7';

const ROLE_CARDS = [
    {
        emoji: '👔', tag: 'Líder de Equipo', color: PRIMARY,
        title: 'El que planifica y aprueba',
        desc: 'Eres responsable de que el equipo funcione. Schedule te da visibilidad total: quién trabaja, cuándo, y si las horas cuadran.',
        bullets: [
            'Asigna turnos y proyectos a tu equipo',
            'Revisa y aprueba las horas que reportan tus trabajadores',
            'Gestiona coberturas y ausencias desde un solo panel',
            'Genera informes de horas exportables a PDF',
        ],
    },
    {
        emoji: '👷', tag: 'Trabajador', color: SUCCESS,
        title: 'El que registra y consulta',
        desc: 'Tu herramienta para el día a día: ver tus turnos, registrar tus horas y coordinar con tu líder sin llamadas ni mensajes perdidos.',
        bullets: [
            'Consulta tu calendario de turnos del mes',
            'Reporta tus horas trabajadas para revisión del líder',
            'Envía solicitudes de ausencia o cobertura',
            'Crea etiquetas propias para organizar tu semana',
        ],
    },
    {
        emoji: '🏢', tag: 'Administrador', color: WARN,
        title: 'El que configura y organiza',
        desc: 'Tienes la vista completa de la organización. Creas equipos, asignas líderes y personalizas cómo se ve cada grupo dentro de la plataforma.',
        bullets: [
            'Crea y personaliza equipos con colores e íconos',
            'Asigna líderes y controla accesos por rol',
            'Gestiona catálogos de puestos y tipos de ausencia',
            'Vista unificada de todos los equipos y proyectos',
        ],
    },
    {
        emoji: '📋', tag: 'Coordinador', color: PINK_PURPLE,
        title: 'El que revisa y valida',
        desc: 'Supervisas varios equipos a la vez. Tu foco está en la aprobación de horas, coberturas y asegurarte de que los horarios se cumplan.',
        bullets: [
            'Aprueba o rechaza horas reportadas por múltiples equipos',
            'Gestiona solicitudes de cobertura entre equipos',
            'Genera reportes comparativos por equipo',
            'Visualiza ausencias y alertas en tiempo real',
        ],
    },
];

const TYPEWRITER_WORDS = ['organizado.', 'eficiente.', 'claro.', 'simplificado.', 'sin caos.'];

export default function LandingClient() {
    const [twWord, setTwWord] = useState('');
    const [paused, setPaused] = useState(false);

    // Typewriter effect
    useEffect(() => {
        let wi = 0, ci = 0, del = false;
        let timer: ReturnType<typeof setTimeout>;
        const tick = () => {
            const w = TYPEWRITER_WORDS[wi];
            if (del) { ci--; setTwWord(w.slice(0, ci)); }
            else { ci++; setTwWord(w.slice(0, ci)); }
            if (!del && ci === w.length) { timer = setTimeout(() => { del = true; tick(); }, 2200); return; }
            if (del && ci === 0) { del = false; wi = (wi + 1) % TYPEWRITER_WORDS.length; }
            timer = setTimeout(tick, del ? 55 : 90);
        };
        timer = setTimeout(tick, 700);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-[var(--pr-bg)] text-[var(--pr-fg)] overflow-x-hidden min-h-screen">
            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-[6vw] backdrop-blur-md border-b"
                style={{ background: 'rgba(22,27,42,.85)', borderColor: 'var(--pr-bsub)' }}>
                <a href="#" className="flex items-center gap-3 font-extrabold text-2xl" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: PRIMARY, boxShadow: `0 0 14px ${PRIMARY}` }}></span>
                    Schedule
                </a>
                <ul className="hidden md:flex gap-12 list-none">
                    <li><a href="#features" className="text-base font-semibold hover:text-white transition-colors" style={{ color: 'var(--pr-fgm)' }}>Funciones</a></li>
                    <li><a href="#how" className="text-base font-semibold hover:text-white transition-colors" style={{ color: 'var(--pr-fgm)' }}>Cómo funciona</a></li>
                    <li><a href="#roles" className="text-base font-semibold hover:text-white transition-colors" style={{ color: 'var(--pr-fgm)' }}>Roles</a></li>
                </ul>
                <Link href="/Login" className="px-7 py-3 rounded-xl text-base font-bold text-white hover:opacity-90 transition-all hover:-translate-y-0.5"
                    style={{ background: PRIMARY, fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: `0 0 20px ${PRIMARY}33` }}>
                    Empezar
                </Link>
            </nav>

            {/* HERO */}
            <section className="relative min-h-screen pt-20 px-[5vw] flex flex-col items-center justify-center text-center overflow-hidden">
                {/* glow */}
                <div className="absolute pointer-events-none" style={{
                    top: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: 700, height: 500,
                    background: `radial-gradient(ellipse at center, ${PRIMARY}26 0%, transparent 70%)`
                }}></div>
                {/* grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(${'#2e3650'}50 1px, transparent 1px), linear-gradient(90deg, ${'#2e3650'}50 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
                }}></div>

                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-semibold uppercase tracking-wider"
                        style={{ background: 'rgba(124,58,237,.18)', border: `1px solid ${PRIMARY}66`, color: PRIMARY }}>
                        <span className="w-1.5 h-1.5 rounded-full pr-pulse" style={{ background: PRIMARY }}></span>
                        Gestión de equipos de trabajo
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 max-w-3xl mx-auto">
                        Tu equipo,<br /><em className="not-italic" style={{ color: PRIMARY }}>{twWord || ' '}</em><span className="pr-tw-cursor" style={{ color: PRIMARY }}>|</span>
                    </h1>
                    <p className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--pr-fgm)' }}>
                        Schedule centraliza turnos, horas y asistencia para que lideres con claridad — sin hojas de cálculo, sin caos.
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center mb-20">
                        <Link href="/Login" className="px-7 py-3.5 rounded-xl font-bold text-white hover:opacity-90 hover:-translate-y-0.5 transition-all"
                            style={{ background: PRIMARY, boxShadow: `0 0 30px ${PRIMARY}33`, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            Comenzar ahora
                        </Link>
                        <a href="#features" className="px-7 py-3.5 rounded-xl font-semibold transition-all hover:text-white"
                            style={{ background: 'transparent', border: '1px solid var(--pr-border)', color: 'var(--pr-fgm)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            Ver demo →
                        </a>
                    </div>
                </div>

                {/* Mockup */}
                <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border" style={{
                    background: 'var(--pr-bg-card)', borderColor: 'var(--pr-border)',
                    boxShadow: '0 40px 100px rgba(0,0,0,.6)'
                }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: 'var(--pr-bg-deep)', borderColor: 'var(--pr-bsub)' }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }}></div>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffbd2e' }}></div>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }}></div>
                        <span className="text-xs ml-3" style={{ color: 'var(--pr-fgs)' }}>schedule.app/dashboard</span>
                    </div>
                    <div className="grid h-[380px]" style={{ gridTemplateColumns: '200px 1fr' }}>
                        <div className="p-3 flex flex-col gap-1.5 border-r" style={{ background: 'var(--pr-bg-deep)', borderColor: 'var(--pr-bsub)' }}>
                            {['Resumen', 'Trabajadores', 'Turnos', 'Proyectos', 'Solicitudes'].map((label, i) => (
                                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${i === 0 ? '' : ''}`}
                                    style={{
                                        background: i === 0 ? 'rgba(124,58,237,.15)' : 'transparent',
                                        color: i === 0 ? PRIMARY : 'var(--pr-fgm)',
                                        fontFamily: "'Plus Jakarta Sans',sans-serif"
                                    }}>
                                    <div className="w-3 h-3 rounded-sm opacity-70" style={{ background: 'currentColor' }}></div>
                                    {label}
                                </div>
                            ))}
                        </div>
                        <div className="p-5 flex flex-col gap-3 overflow-hidden">
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { label: 'Trabajadores', val: '24', color: PRIMARY },
                                    { label: 'Proyectos', val: '7', color: SUCCESS },
                                    { label: 'Pendientes', val: '3', color: WARN },
                                ].map(s => (
                                    <div key={s.label} className="p-3 rounded-xl border" style={{
                                        background: 'rgba(22,27,42,.8)', borderColor: 'var(--pr-bsub)'
                                    }}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--pr-fgs)' }}>{s.label}</span>
                                        <span className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(22,27,42,.8)', borderColor: 'var(--pr-bsub)' }}>
                                <div className="grid px-3 py-2" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr', background: 'var(--pr-bg-deep)' }}>
                                    {['Empleado', 'Turno', 'Horas', 'Estado'].map(h => (
                                        <span key={h} className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--pr-fgs)' }}>{h}</span>
                                    ))}
                                </div>
                                {[
                                    { name: 'Ana García', shift: '08:00–16:00', hrs: '7.5h', tag: 'Activo', cls: 'green' },
                                    { name: 'Luis Mora', shift: '14:00–22:00', hrs: '6.0h', tag: 'Turno', cls: 'purple' },
                                    { name: 'Sofía Reyes', shift: '00:00–08:00', hrs: '8.0h', tag: 'Revisión', cls: 'warn' },
                                    { name: 'Marco Silva', shift: '08:00–16:00', hrs: '8.0h', tag: 'Activo', cls: 'green' },
                                ].map((r) => (
                                    <div key={r.name} className="grid items-center px-3 py-2 border-t" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr', borderColor: 'var(--pr-bsub)' }}>
                                        <span className="text-[11px] flex items-center gap-2" style={{ color: 'var(--pr-fgm)' }}>
                                            <span className="w-5 h-5 rounded-full inline-block" style={{ background: `linear-gradient(135deg,${PRIMARY},${SUCCESS})` }}></span>
                                            {r.name}
                                        </span>
                                        <span className="text-[11px]" style={{ color: 'var(--pr-fgm)' }}>{r.shift}</span>
                                        <span className="text-[11px]" style={{ color: 'var(--pr-fgm)' }}>{r.hrs}</span>
                                        <span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                                                background: r.cls === 'green' ? 'rgba(16,185,129,.15)' : r.cls === 'warn' ? 'rgba(245,158,11,.15)' : 'rgba(124,58,237,.15)',
                                                color: r.cls === 'green' ? SUCCESS : r.cls === 'warn' ? WARN : PRIMARY,
                                            }}>{r.tag}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-24 px-[5vw]">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-14">
                        <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: PRIMARY }}>Funcionalidades</p>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Todo lo que tu equipo necesita</h2>
                        <p className="max-w-md leading-relaxed" style={{ color: 'var(--pr-fgm)' }}>
                            Desde el registro de entrada hasta los reportes mensuales, Schedule lo tiene cubierto.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RoleFeatureCard
                            color={PRIMARY}
                            emoji="👔"
                            title="Panel del Líder"
                            sub="Control total del equipo"
                            tag="Administrador"
                            items={[
                                ['Gestión de personal', 'CRUD completo de empleados, puestos y roles'],
                                ['Planificación de turnos', 'Asigna y visualiza turnos con vista de calendario'],
                                ['Aprobación de horas', 'Revisa y aprueba las horas que reportan tus trabajadores'],
                                ['Gestión de coberturas', 'Crea y administra solicitudes de cobertura de turnos'],
                                ['Reportes exportables', 'Informes de horas por empleado o equipo, exportables a PDF'],
                                ['Personalización de equipos', 'Colores, íconos y líderes configurables por equipo'],
                            ]}
                        />
                        <RoleFeatureCard
                            color={SUCCESS}
                            emoji="👷"
                            title="Panel del Trabajador"
                            sub="Gestión simple del día a día"
                            tag="Colaborador"
                            items={[
                                ['Registro de horas trabajadas', 'Reporta tus horas al líder para revisión y aprobación directa'],
                                ['Visualización de turnos', 'Consulta tus turnos asignados en el calendario mensual'],
                                ['Solicitudes de ausencia y cobertura', 'Envía solicitudes a tu líder con motivo y rango de fechas'],
                                ['Etiquetas personalizadas', 'Crea etiquetas propias para organizar tu calendario'],
                                ['Perfil y equipo', 'Consulta tus datos, proyecto asignado y compañeros'],
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-24 px-[5vw]" style={{ background: 'var(--pr-bg-deep)' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: PRIMARY }}>Proceso</p>
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-4">En marcha en minutos</h2>
                    <p className="max-w-lg mx-auto mb-16 leading-relaxed" style={{ color: 'var(--pr-fgm)' }}>
                        Sin configuraciones complejas. Sin manuales. Tres pasos y tu equipo está listo.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {[
                            ['01', 'Crea tu organización', 'Registra tu empresa y configura los puestos y roles que necesitas. Listo en menos de 3 minutos.'],
                            ['02', 'Invita a tu equipo', 'Comparte un enlace o llena el formulario por cada trabajador. Ellos reciben acceso instantáneo.'],
                            ['03', 'Lidera con claridad', 'Asigna turnos, revisa horas y aprueba solicitudes desde un dashboard centralizado.'],
                        ].map(([num, title, desc]) => (
                            <div key={num} className="px-6">
                                <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center font-extrabold text-base relative z-10"
                                    style={{
                                        background: 'rgba(124,58,237,.18)', border: `2px solid ${PRIMARY}`,
                                        color: PRIMARY, boxShadow: `0 0 20px ${PRIMARY}33`,
                                        fontFamily: "'Plus Jakarta Sans',sans-serif"
                                    }}>
                                    {num}
                                </div>
                                <h3 className="font-bold text-base mb-2.5">{title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--pr-fgm)' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROLES CAROUSEL — auto-scroll continuo, pausa al hover */}
            <section id="roles" className="py-24 px-[5vw]">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: PRIMARY }}>Roles</p>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-2">Hecho para cada<br />persona del equipo</h2>
                        <p className="max-w-md leading-relaxed" style={{ color: 'var(--pr-fgm)' }}>
                            Cada rol tiene su propia experiencia dentro de la plataforma.
                        </p>
                    </div>

                    <style>{`
                        @keyframes pr-roles-scroll {
                            0%   { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .pr-roles-track {
                            animation: pr-roles-scroll 32s linear infinite;
                            will-change: transform;
                        }
                        .pr-roles-paused .pr-roles-track {
                            animation-play-state: paused;
                        }
                    `}</style>

                    <div
                        className={`overflow-hidden ${paused ? 'pr-roles-paused' : ''}`}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        style={{
                            maskImage: 'linear-gradient(90deg, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)',
                        }}
                    >
                        <div className="pr-roles-track flex gap-5 w-max">
                            {[...ROLE_CARDS, ...ROLE_CARDS].map((c, i) => (
                                <div key={i} className="rounded-2xl p-8 flex-shrink-0"
                                    style={{
                                        width: 360,
                                        background: 'var(--pr-bg-card)', border: `1px solid ${c.color}59`
                                    }}>
                                    <div className="rounded-xl flex items-center justify-center mb-5 text-2xl"
                                        style={{ background: `${c.color}26`, width: 56, height: 56 }}>
                                        {c.emoji}
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
                                        style={{ background: `${c.color}26` }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }}></div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.color }}>{c.tag}</span>
                                    </div>
                                    <h3 className="font-extrabold text-lg mb-2.5">{c.title}</h3>
                                    <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--pr-fgm)' }}>{c.desc}</p>
                                    <div className="flex flex-col gap-2.5 pt-5" style={{ borderTop: '1px solid var(--pr-border)' }}>
                                        {c.bullets.map((b, j) => (
                                            <div key={j} className="flex gap-2.5 items-start text-sm" style={{ color: 'var(--pr-fgm)' }}>
                                                <span className="flex-shrink-0 mt-0.5" style={{ color: c.color }}>◈</span>{b}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-[5vw]">
                <div className="max-w-3xl mx-auto text-center rounded-3xl p-12 md:p-16 relative overflow-hidden"
                    style={{ background: 'var(--pr-bg-card)', border: `1px solid ${PRIMARY}59` }}>
                    <div className="absolute pointer-events-none" style={{
                        top: -100, left: '50%', transform: 'translateX(-50%)',
                        width: 400, height: 400,
                        background: `radial-gradient(ellipse, ${PRIMARY}1f 0%, transparent 70%)`
                    }}></div>
                    <div className="relative">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">¿Listo para ordenar<br />tu equipo?</h2>
                        <p className="mb-10" style={{ color: 'var(--pr-fgm)' }}>Empieza hoy. Sin tarjeta de crédito, sin contratos. Solo resultados.</p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            <Link href="/Login" className="px-7 py-3.5 rounded-xl font-bold text-white hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                style={{ background: PRIMARY, boxShadow: `0 0 30px ${PRIMARY}33`, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                Iniciar sesión
                            </Link>
                            <Link href="/Login" className="px-7 py-3.5 rounded-xl font-semibold transition-all hover:text-white"
                                style={{ background: 'transparent', border: '1px solid var(--pr-border)', color: 'var(--pr-fgm)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                Ver el dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 px-[5vw] flex items-center justify-between flex-wrap gap-4 border-t" style={{ borderColor: 'var(--pr-bsub)' }}>
                <a href="#" className="flex items-center gap-2 font-extrabold text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: PRIMARY, boxShadow: `0 0 10px ${PRIMARY}` }}></span>
                    Schedule
                </a>
                <p className="text-xs" style={{ color: 'var(--pr-fgs)' }}>© 2026 Schedule. Sistema de gestión de equipos.</p>
                <div className="flex gap-6">
                    <a href="#" className="text-xs hover:text-[var(--pr-fgm)] transition-colors" style={{ color: 'var(--pr-fgs)' }}>Privacidad</a>
                    <a href="#" className="text-xs hover:text-[var(--pr-fgm)] transition-colors" style={{ color: 'var(--pr-fgs)' }}>Términos</a>
                    <Link href="/Login" className="text-xs hover:text-[var(--pr-fgm)] transition-colors" style={{ color: 'var(--pr-fgs)' }}>Dashboard</Link>
                </div>
            </footer>
        </div>
    );
}

function RoleFeatureCard({ color, emoji, title, sub, tag, items }: {
    color: string; emoji: string; title: string; sub: string; tag: string; items: string[][];
}) {
    return (
        <div className="rounded-2xl p-8" style={{ background: 'var(--pr-bg-card)', border: `1px solid ${color}59` }}>
            <div className="flex items-center gap-3 mb-7 pb-5" style={{ borderBottom: '1px solid var(--pr-border)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${color}26` }}>{emoji}</div>
                <div className="flex-1">
                    <h3 className="font-extrabold text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</h3>
                    <p className="text-xs" style={{ color: 'var(--pr-fgm)' }}>{sub}</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${color}26`, color }}>{tag}</span>
            </div>
            <ul className="list-none flex flex-col gap-3.5">
                {items.map(([h, p]) => (
                    <li key={h} className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${color}26`, border: `1.5px solid ${color}` }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}></div>
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{h}</p>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--pr-fgm)' }}>{p}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
