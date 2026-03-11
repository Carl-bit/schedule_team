const ausenciaService = require('../services/ausencia.service');
const { obtenerFraseAleatoria } = require('../utils/naas/naas');

// Obtener todas las ausencias
const getAusencias = async (req, res) => {
    try {
        const ausencias = await ausenciaService.getAusencias();
        if (ausencias.length === 0) {
            return res.status(404).json({
                mensaje: "No hay ausencias registradas.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.json(ausencias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// Obtener ausencias por empleado
const getAusenciasByEmpleado = async (req, res) => {
    try {
        const { empleado_id } = req.params;
        const ausencias = await ausenciaService.getAusenciasByEmpleado(empleado_id);
        res.json(ausencias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// Registrar una ausencia
const createAusencia = async (req, res) => {
    try {
        const { empleado_id, tipo_ausencia_id, inicio, fin } = req.body;

        if (!empleado_id || !tipo_ausencia_id || !inicio || !fin) {
            return res.status(400).json({
                error: "Faltan datos para procesar la ausencia.",
                frase: obtenerFraseAleatoria()
            });
        }

        const nuevaAusencia = await ausenciaService.createAusencia(empleado_id, tipo_ausencia_id, inicio, fin);
        res.status(201).json(nuevaAusencia);
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: "El empleado o el tipo de ausencia no existen.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// Eliminar una ausencia
const deleteAusencia = async (req, res) => {
    try {
        const { id } = req.params;
        const ausenciaBorrada = await ausenciaService.deleteAusencia(id);
        if (!ausenciaBorrada) {
            return res.status(404).json({ error: "No encontré esa ausencia." });
        }
        res.json({ mensaje: "Ausencia eliminada.", datos: ausenciaBorrada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// Actualizar estado de ausencia (aprobar/rechazar)
const updateEstadoAusencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_id } = req.body;

        if (!estado_id) {
            return res.status(400).json({ error: "Falta el estado_id." });
        }

        const actualizado = await ausenciaService.updateEstadoAusencia(id, estado_id);
        if (!actualizado) {
            return res.status(404).json({ error: "Ausencia no encontrada." });
        }
        res.json(actualizado);
    } catch (error) {
        console.error("Error actualizando estado de ausencia:", error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getAusencias,
    getAusenciasByEmpleado,
    createAusencia,
    deleteAusencia,
    updateEstadoAusencia
};