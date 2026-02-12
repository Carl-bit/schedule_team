import React from 'react'; // <--- Importante para evitar dudas con los tipos
import Header from '../Trabajador/Header';
import Square from "../../components/Backgrounds/Square";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen bg-gray-900 text-white font-sans">
            <div className="absolute inset-0 z-0 h-full w-full">
                <Square
                    direction="diagonal" // Opcional: ajusta según la documentación
                    speed={0.3}
                    borderColor="#1e3a8aff" // El azul oscuro del borde
                    hoverFillColor="#06b6d4" // El azul claro al pasar el mouse
                    squareSize={63}
                />
            </div>

            {/* 2. Contenedor Principal (Header + Tu Página) */}
            <div className="relative z-10 flex flex-col h-screen">

                {/* 2.1 Header Superior */}
                <Header />

                {/* 2.2 Aquí se inyecta tu page.tsx (con tus 3 columnas) */}
                <main className="flex-1 overflow-auto p-4">
                    {children}
                </main>

            </div>

        </div>
    );
}