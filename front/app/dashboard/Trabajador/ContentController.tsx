"use client";
import CalendarPanel from "./CalendarPanel";
import EquiposPanel from "../Trabajador/EquiposPanel";
import SolicitudesPanel from "../Trabajador/SolicitudesPanel";
import ResumePanel from "../Trabajador/ResumePanel";
import { useUser } from "@/app/hooks/useUser";


interface ContentControllerProps {
    vista: 'calendar' | 'equipos' | 'solicitudes' | 'resume';
}

export default function ContentController({ vista }: ContentControllerProps) {
    const { user } = useUser();
    switch (vista) {
        case 'resume':
            return <ResumePanel />;
        case 'calendar':
            return user?.empleado_id ? <CalendarPanel empleado_id={user.empleado_id} /> : null;
        case 'equipos':
            return <EquiposPanel />;
        case 'solicitudes':
            return <SolicitudesPanel />;
        default:
            return <ResumePanel />;
    }
}