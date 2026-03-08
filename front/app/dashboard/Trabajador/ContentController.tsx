import CalendarPanel from "./CalendarPanel";
import EquiposPanel from "../Trabajador/EquiposPanel";
import SolicitudesPanel from "../Trabajador/SolicitudesPanel";
import ResumePanel from "../Trabajador/ResumePanel";


interface ContentControllerProps {
    vista: 'calendar' | 'equipos' | 'solicitudes' | 'resume'; // <--- ¡Aquí está la magia! Solo estas 3 existen.
}

export default function ContentController({ vista }: ContentControllerProps) {
    switch (vista) {
        case 'resume':
            return <ResumePanel />; // 👈 Nueva vista
        case 'calendar':
            return <CalendarPanel />;
        case 'equipos':
            return <EquiposPanel />;
        case 'solicitudes':
            return <SolicitudesPanel />;
        default:
            return <ResumePanel />; // 👈 Que sea el default también
    }
} 