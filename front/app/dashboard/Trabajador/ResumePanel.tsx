export default function ResumePanel() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">

            {/* Tarjeta de Bienvenida */}
            <div className="col-span-full bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
                <h1 className="text-3xl font-bold text-white mb-2">¡Hola de nuevo! 👋</h1>
                <p className="text-gray-300">Aquí tienes el resumen de tu actividad hoy.</p>
            </div>

            {/* Widgets Rápidos (Ejemplos) */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Próximo Turno</h3>
                <p className="text-2xl font-bold text-white">Mañana, 08:00 AM</p>
            </div>

            <div className="bg-gray-800/60 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Solicitudes Pendientes</h3>
                <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-pink-500">2</span>
                    <span className="text-sm text-gray-400">Esperando<br />aprobación</span>
                </div>
            </div>

            {/* Puedes agregar más widgets aquí */}

        </div>
    );
}