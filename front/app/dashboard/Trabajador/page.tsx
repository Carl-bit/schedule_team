"use client"; // <--- Necesario para usar useState
import { useState } from 'react';
import styles from './dashboard.module.css'; // <--- 1. Importamos los estilos
import StatsPanel from "./StatsPanel";       // <--- 2. Ruta corregida (sin /dashboard)
import ContentController from "./ContentController";
import ProfilePanel from "./ProfilePanel";

export default function DashboardPage() {
    // Declaramos el estado inicial en "calendar"
    const [vista, setVista] = useState<'calendar' | 'equipos' | 'solicitudes' | 'resume'>("resume");


    return (
        <div className="relative min-h-screen text-white">

            {/* 1. El Fondo (Squares) */}

            <div className={`relative z-10 p-6 ${styles.dashboardGrid}`}>
                <StatsPanel />

                {/* ¿Qué prop le pasamos aquí para que sepa QUÉ mostrar? */}
                <ContentController vista={vista} />

                {/* ¿Qué prop le pasamos aquí para que pueda CAMBIAR la vista? */}
                <ProfilePanel setVista={setVista} />
            </div>
        </div>
    );
}