"use client";
import { useState } from 'react';
import styles from './dashboard.module.css';
import StatsPanel from "./StatsPanel";
import ContentController from "./ContentController";
import ProfilePanel from "./ProfilePanel";

export default function DashboardPage() {
    const [vista, setVista] = useState<'calendar' | 'equipos' | 'solicitudes' | 'resume'>("resume");

    return (
        <div className={styles.dashboardGrid}>
            <StatsPanel />
            <ContentController vista={vista} />
            <ProfilePanel setVista={setVista} />
        </div>
    );
}
