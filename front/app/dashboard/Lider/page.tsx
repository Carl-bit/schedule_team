"use client";
import { useState } from 'react';
import styles from './dashboard.module.css';
import LiderContentController from "./LiderContentController";
import LiderProfilePanel from "./LiderProfilePanel";

export default function LiderPage() {
    const [vista, setVista] = useState<'resume' | 'trabajadores' | 'proyectos' | 'catalogos' | 'solicitudes' | 'informe'>('resume');

    return (
        <div className="relative min-h-screen text-white">
            <div className={`relative z-10 p-6 ${styles.dashboardGrid}`}>
                {/* Contenido principal (ocupa todo el espacio izquierdo) */}
                <LiderContentController vista={vista} />

                {/* Barra derecha: perfil + menú */}
                <LiderProfilePanel setVista={setVista} vistaActual={vista} />
            </div>
        </div>
    );
}
