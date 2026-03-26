import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { div } from 'framer-motion/client';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/app/lib/api';

interface ModalModificarProps {
    user: {
        empleado_id: string;
        nombre: string;
        alias?: string;
        telefono?: string;
    };
    onClose: () => void; // Es una función que no devuelve nada
    onActualizar: () => void;
}

export default function ModalModificar({ user, onClose, onActualizar }: ModalModificarProps) {
    // Estado para controlar qué pestaña vemos: 'general' o 'security'

    const [[tab, direction], setTabState] = useState(['general', 0]);
    const [isLoading, setIsLoading] = useState(false);
    const [mensaje, setMensaje] = useState('')
    const tabIndices: Record<string, number> = { general: 0, security: 1 };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%', // Usar porcentajes es más seguro para contenedores fluidos
            opacity: 0,
            position: 'absolute' as const, // Forzamos absolute durante la entrada si es necesario
        }),
        center: {
            x: 0,
            opacity: 1,
            position: 'relative' as const, // Vuelve a relativo cuando está quieto
            zIndex: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%', // OJO: Invertimos la lógica aquí
            opacity: 0,
            position: 'absolute' as const, // Al salir, se vuelve absoluto para no empujar al nuevo
            zIndex: 0,
        }),
    };


    const [formData, setFormData] = useState({
        id: user.empleado_id || '',
        nombre_empleado: user.nombre || '',
        alias_empleado: user.alias || '',
        telefono_empleado: user.telefono || '',
    });

    const [passData, setPassData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const isMatch = passData.newPassword === passData.confirmPassword;
    const hasTypedNewPass = passData.newPassword.length > 0;
    const hasTypedConfirmPass = passData.confirmPassword.length > 0;
    let borderClass = "border-black/10"; // Neutro por defecto

    if (hasTypedNewPass && hasTypedConfirmPass) {
        borderClass = isMatch ? "border-green-500" : "border-red-500";
    }

    //revisar los requisitos de la contraseña

    const hasMinLength = passData.newPassword.length >= 8;
    const hasNumber = /\d/.test(passData.newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passData.newPassword);
    // 4. ¿Todo está correcto?
    const isPasswordValid = hasMinLength && hasNumber && hasSpecial && (passData.newPassword === passData.confirmPassword);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // 1. Avisar a la API para matar la cookie
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            // 2. Limpiar localStorage
            localStorage.removeItem('user_data');

            // 3. Redirigir al Login
            router.push('/Login');
        } catch (error) {
            console.error('Error al salir:', error);
        }
    };


    const handleGeneralSubmit = async () => {

        try {
            setIsLoading(true);
            setMensaje('');
            // 1. Preparamos la llamada al servidor
            const response = await fetch(`${API_BASE}/empleados/${formData.id}`, { // 👈 Ajusta tu URL
                method: 'PUT', // o 'PATCH' dependiendo de tu backend
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // Si usas tokens
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error al actualizar');

            const data = await response.json();

            // 1. Traemos la información actual guardada
            const currentStorage = JSON.parse(localStorage.getItem('user_data') || '{}');

            // 2. Actualizamos solo los campos que cambiaron
            const updatedStorage = {
                ...currentStorage,
                nombre_empleado: formData.nombre_empleado,
                alias_empleado: formData.alias_empleado,
                telefono_empleado: formData.telefono_empleado
            };

            // 3. Guardamos la versión actualizada
            localStorage.setItem('user_data', JSON.stringify(updatedStorage));
            onActualizar();
            // 2. Feedback visual y actualización de estado
            setIsLoading(false);
            setMensaje('¡Datos actualizados correctamente! ✅');
            //alert("¡Datos actualizados correctamente! ✅");

            //onClose(); // Cerramos el modal

        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setMensaje('Hubo un problema al guardar los cambios ❌');
            //alert("Hubo un problema al guardar los cambios ❌");
        }
    };


    const handlePasswordSubmit = async () => {
        try {
            setIsLoading(true);
            setMensaje('');

            // 1. Petición corregida (Solo ID en URL, y el newPassword en el body)
            const response = await fetch(`${API_BASE}/empleados/${user.empleado_id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword: passData.newPassword })
            });

            if (!response.ok) throw new Error('Error al actualizar');

            // 2. Apagamos la carga
            setIsLoading(false);

            // 3. ¡Iniciamos la cuenta regresiva! 🚀
            let segundos = 5; // Empezamos en 3 segundos
            setMensaje(`¡Contraseña actualizada! Saliendo en ${segundos}...`);

            // setInterval ejecutará este bloque de código cada 1000 milisegundos (1 segundo)
            const temporizador = setInterval(() => {
                segundos--; // Restamos 1 al contador

                if (segundos > 0) {
                    // Si aún queda tiempo, actualizamos el texto en pantalla
                    setMensaje(`¡Contraseña actualizada! Saliendo en ${segundos}...`);
                } else {
                    // Si llegó a 0, detenemos el reloj y cerramos sesión
                    clearInterval(temporizador);
                    handleLogout();
                }
            }, 1000);

        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setMensaje('Hubo un problema al guardar los cambios ❌');
        }
    };




    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
            <motion.div
                // A. Animación de Entrada (Pop)
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}

                // B. Animación de Altura (Layout)
                layout

                className="w-[500px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-gray-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 shadow-blue-500/10"
            >
                <div className="flex w-full border-b border-white/10">
                    <button
                        onClick={() => setTabState(['general', -1])} // -1 significa que venimos hacia la izquierda
                        disabled={isLoading || mensaje !== ''}
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors duration-300 ${tab === 'general'
                            ? 'border-blue-500 text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        Datos Generales
                    </button>
                    <button
                        onClick={() => setTabState(['security', 1])} // 1 significa que vamos hacia la derecha
                        disabled={isLoading || mensaje !== ''}
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors duration-300 ${tab === 'security'
                            ? 'border-red-500 text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        Contraseña
                    </button>
                </div>

                {/* --- HEADER CON TABS --- */}
                <div className="p-6 overflow-hidden">
                    {/* Un solo AnimatePresence para controlar ambas pestañas */}
                    <AnimatePresence mode="sync" custom={direction} initial={false}>

                        {/* ========================================== */}
                        {/* VISTA 1: DATOS GENERALES          */}
                        {/* ========================================== */}
                        {tab === 'general' ? (
                            <motion.div
                                key="general"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-4"
                            >
                                {/* 1. MODO CARGANDO ⏳ */}
                                {isLoading ? (
                                    <div className="py-10 text-center animate-pulse">
                                        <p className="text-blue-400 text-sm font-medium">Guardando cambios...</p>
                                    </div>

                                    /* 2. MODO MENSAJE (Éxito/Error) 💬 */
                                ) : mensaje ? (
                                    <div className="py-10 text-center">
                                        <p className="text-white text-sm font-medium">{mensaje}</p>
                                    </div>

                                    /* 3. MODO FORMULARIO NORMAL ✍️ */
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase">Nombre</label>
                                        <input
                                            value={formData.nombre_empleado}
                                            onChange={(e) => setFormData({ ...formData, nombre_empleado: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                                        />

                                        <label className="text-xs text-gray-400 uppercase mt-2 block">Alias</label>
                                        <input
                                            value={formData.alias_empleado}
                                            onChange={(e) => setFormData({ ...formData, alias_empleado: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                                        />

                                        <label className="text-xs text-gray-400 uppercase mt-2 block">Teléfono</label>
                                        <input
                                            value={formData.telefono_empleado}
                                            onChange={(e) => setFormData({ ...formData, telefono_empleado: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                )}

                                {/* Botón Dinámico de la pestaña General */}
                                <button
                                    onClick={mensaje ? onClose : handleGeneralSubmit}
                                    disabled={isLoading}
                                    className={`w-full py-2 rounded mt-4 transition-all duration-300 ${isLoading ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white'
                                        }`}
                                >
                                    {isLoading ? "Por favor espera..." : mensaje ? "Cerrar" : "Guardar Cambios"}
                                </button>

                            </motion.div>

                        ) : (

                            /* ========================================== */
                            /* VISTA 2: CONTRASEÑA              */
                            /* ========================================== */
                            <motion.div
                                key="security"
                                custom={direction}
                                variants={slideVariants} // Usamos las mismas variantes para consistencia
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-4"
                            >
                                {isLoading ? (
                                    <div className="py-10 text-center animate-pulse">
                                        <p className="text-blue-400 text-sm font-medium">Guardando cambios...</p>
                                    </div>
                                    // 1. Mostrar texto de "Cargando..."
                                ) : mensaje ? (
                                    <div className="py-10 text-center">
                                        <p className="text-white text-sm font-medium">{mensaje}</p>
                                    </div>
                                    // 2. Mostrar el texto de éxito/error
                                ) : (
                                    // 3. Mostrar el formulario (los inputs)
                                    <>

                                        <div className="flex items-center justify-center gap-3 p-3 text-center bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-xs mb-4 font-bold shadow-sm">
                                            <span className="material-symbols-outlined text-base">warning</span>
                                            <span>Al cambiar tu contraseña debes volver a iniciar sesión...</span>
                                            <span className="material-symbols-outlined text-base">warning</span>
                                        </div><div>
                                            <label className="text-xs text-gray-400 uppercase">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white mt-1 mb-2"
                                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })} />

                                            <label className="text-xs text-gray-400 uppercase">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white mt-1"
                                                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })} />
                                        </div><div className="space-y-1">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Requisitos:</span>
                                            <ul className="space-y-1 pl-4 mt-2">
                                                <li className={`text-xs transition-colors duration-300 flex items-center gap-2 ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                                                    <span className="material-icons text-[10px]">{hasMinLength ? 'check_circle' : 'circle'}</span>
                                                    Mínimo 8 caracteres
                                                </li>
                                                <li className={`text-xs transition-colors duration-300 flex items-center gap-2 ${hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                                                    <span className="material-icons text-[10px]">{hasNumber ? 'check_circle' : 'circle'}</span>
                                                    Mínimo 1 número
                                                </li>
                                                <li className={`text-xs transition-colors duration-300 flex items-center gap-2 ${hasSpecial ? 'text-green-400' : 'text-gray-500'}`}>
                                                    <span className="material-icons text-[10px]">{hasSpecial ? 'check_circle' : 'circle'}</span>
                                                    Mínimo 1 carácter especial (!@#$...)
                                                </li>
                                            </ul>
                                        </div></>

                                )}


                                {/* Botón de la pestaña Contraseña */}
                                <button
                                    onClick={mensaje ? onClose : handlePasswordSubmit}
                                    disabled={!isPasswordValid || isLoading}
                                    className={`w-full py-2 rounded mt-4 transition-all duration-300
                    ${isPasswordValid
                                            ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'}
                    `}
                                >
                                    {isLoading ? "Por favor espera..." : mensaje ? "Cerrar Sesion" : "Cambiar Contraseña"}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FOOTER: CERRAR */}
                <motion.div layout="preserve-aspect" className="bg-black/20 p-4 flex justify-end border-t border-white/5">
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
                </motion.div>

            </motion.div >
        </div >
    );
}