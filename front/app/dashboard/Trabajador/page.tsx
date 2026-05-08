"use client";
import { useState } from 'react';
import styles from './dashboard.module.css';
import StatsPanel from "./StatsPanel";
import ContentController from "./ContentController";
import ProfilePanel from "./ProfilePanel";
import CalendarLeftSidebar from "./CalendarLeftSidebar";
import { useUser } from '@/app/hooks/useUser';

export default function DashboardPage() {
    const [vista, setVista] = useState<'calendar' | 'equipos' | 'solicitudes' | 'resume'>("resume");
    const { user } = useUser();

    return (
        <div className={styles.dashboardGrid}>
            {vista === 'calendar' ? <CalendarLeftSidebar /> : <StatsPanel empleado_id={user?.empleado_id} />}
            <ContentController vista={vista} />
            <ProfilePanel setVista={setVista} />
        </div>
    );
}
