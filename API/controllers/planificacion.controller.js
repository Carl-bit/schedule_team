const planificacionService = require('../services/planificacion.service');
const { obtenerFraseAleatoria } = require('../utils/naas/naas');

const getPlanificacionByEmpleado = async (req, res) => {
    try {
        const { empleado_id } = req.params;

        if (!empleado_id) {
            return res.status(400).json({ error: "Falta el empleado_id." });
        }

        const planificacion = await planificacionService.getPlanificacionByEmpleado(empleado_id);
        res.json(planificacion);
    } catch (error) {
        console.error("Error obteniendo planificación:", error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const createPlanificacion = async (req, res) => {
    try {
        const { empleado_id } = req.params;
        const data = { ...req.body, empleado_id };
        const nuevoRegistro = await planificacionService.createPlanificacion(data);
        res.status(201).json(nuevoRegistro);
    } catch (error) {
        console.error("Error creando planificación:", error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deletePlanificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const borrado = await planificacionService.deletePlanificacion(id);
        if (!borrado) {
            return res.status(404).json({ error: "No se encontró el turno planificado." });
        }
        res.json({ mensaje: "Turno eliminado.", datos: borrado });
    } catch (error) {
        console.error("Error eliminando planificación:", error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const savePlanificacionesBulk = async (req, res) => {
    try {
        const { empleado_id } = req.params;
        const { turnos } = req.body;

        if (!empleado_id || !turnos || !Array.isArray(turnos)) {
            return res.status(400).json({ error: "Datos inválidos (empleado_id y turnos son requeridos)." });
        }

        const resultados = await planificacionService.savePlanificacionesBulk(empleado_id, turnos);
        res.status(201).json({
            mensaje: "Planificaciones guardadas/actualizadas.",
            count: resultados.length,
            datos: resultados
        });
    } catch (error) {
        console.error("Error guardando planificaciones masivas:", error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getPlanificacionByEmpleado,
    createPlanificacion,
    deletePlanificacion,
    savePlanificacionesBulk
};
