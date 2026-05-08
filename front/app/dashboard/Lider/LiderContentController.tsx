import LiderResumePanel from "./LiderResumePanel";
import TrabajadoresPanel from "./TrabajadoresPanel";
import ProyectosPanel from "./ProyectosPanel";
import CatalogosPanel from "./CatalogosPanel";
import SolicitudesLiderPanel from "./SolicitudesLiderPanel";
import InformePanel from "./InformePanel";
import LiderCalendarPanel from "./LiderCalendarPanel";

export type LiderVista = 'resume' | 'trabajadores' | 'proyectos' | 'catalogos' | 'solicitudes' | 'informe' | 'calendario';

interface LiderContentControllerProps {
    vista: LiderVista;
}

export default function LiderContentController({ vista }: LiderContentControllerProps) {
    switch (vista) {
        case 'resume':
            return <LiderResumePanel />;
        case 'trabajadores':
            return <TrabajadoresPanel />;
        case 'proyectos':
            return <ProyectosPanel />;
        case 'catalogos':
            return <CatalogosPanel />;
        case 'solicitudes':
            return <SolicitudesLiderPanel />;
        case 'informe':
            return <InformePanel />;
        case 'calendario':
            return <LiderCalendarPanel />;
        default:
            return <LiderResumePanel />;
    }
}
