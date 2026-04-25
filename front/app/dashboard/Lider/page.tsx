"use client";
import { useState } from 'react';
import styles from './dashboard.module.css';
import LiderContentController from "./LiderContentController";
import LiderProfilePanel from "./LiderProfilePanel";

export default function LiderPage() {
    const [vista, setVista] = useState<'resume' | 'trabajadores' | 'proyectos' | 'catalogos' | 'solicitudes' | 'informe'>('resume');

    return (
        <div className={styles.dashboardGrid}>
            <LiderContentController vista={vista} />
            <LiderProfilePanel setVista={setVista} vistaActual={vista} />
        </div>
    );
}
