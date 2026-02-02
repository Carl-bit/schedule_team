const horaService = require('../services/hora.service');
const { obtenerFraseAleatoria } = require('../utils/naas');

const getHoras = async (req, res) => {
    try {
        const horas = await horaService.getHoras();
        res.json(horas);
    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const iniciarJornada = async (req, res) => {
    try {
        const { empleado_id } = req.body;

        if (!empleado_id) {
            return res.status(400).json({ error: "Falta el ID del empleado.", frase: obtenerFraseAleatoria() });
        }

        // 1. ANTES DE CREAR, VERIFICAMOS
        const turnoAbierto = await horaService.verificarSiTrabaja(empleado_id);

        if (turnoAbierto) {
            return res.status(409).json({ // 409 = Conflict
                error: "¡Ya estás trabajando! Cierra tu turno anterior primero.",
                turno_pendiente: turnoAbierto,
                frase: obtenerFraseAleatoria()
            });
        }

        // 2. Si no está trabajando, lo dejamos entrar
        const nuevoRegistro = await horaService.iniciarJornada(empleado_id);
        res.status(201).json(nuevoRegistro);

    } catch (error) {
        console.error(error);
        if (error.code === '23503') { // Error de llave foránea (usuario no existe)
            return res.status(400).json({ error: "Empleado no encontrado.", frase: obtenerFraseAleatoria() });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const terminarJornada = async (req, res) => {
    try {
        const { id } = req.params;
        const registroActualizado = await horaService.terminarJornada(id);

        if (!registroActualizado) {
            return res.status(404).json({ error: "Registro no encontrado.", frase: obtenerFraseAleatoria() });
        }
        res.json(registroActualizado);
    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// --- NUEVO: Eliminar registro ---
const deleteHora = async (req, res) => {
    try {
        const { id } = req.params;
        const horaBorrada = await horaService.deleteHora(id);

        if (!horaBorrada) {
            return res.status(404).json({ error: "Ese registro no existe.", frase: obtenerFraseAleatoria() });
        }
        res.json({ mensaje: "Registro de hora eliminado (era un error, supongo).", datos: horaBorrada });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getHoras,
    iniciarJornada,
    terminarJornada,
    deleteHora // Exportar
};