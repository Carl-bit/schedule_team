const planificacionService = require('../services/planificacion.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getAllPlanificaciones = asyncHandler(async (req, res) => {
    const planificaciones = await planificacionService.getAllPlanificaciones();
    res.json(planificaciones);
});

const getPlanificacionByEmpleado = asyncHandler(async (req, res) => {
    const { empleado_id } = req.params;
    if (!empleado_id) throw new AppError("Falta el empleado_id.");
    const planificacion = await planificacionService.getPlanificacionByEmpleado(empleado_id);
    res.json(planificacion);
});

const createPlanificacion = asyncHandler(async (req, res) => {
    const { empleado_id } = req.params;
    const data = { ...req.body, empleado_id };
    const nuevoRegistro = await planificacionService.createPlanificacion(data);
    res.status(201).json(nuevoRegistro);
});

const deletePlanificacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const borrado = await planificacionService.deletePlanificacion(id);
    if (!borrado) throw new AppError("No se encontró el turno planificado.", 404);
    res.json({ mensaje: "Turno eliminado.", datos: borrado });
});

const savePlanificacionesBulk = asyncHandler(async (req, res) => {
    const { empleado_id } = req.params;
    const { turnos } = req.body;

    if (!empleado_id || !turnos || !Array.isArray(turnos)) {
        throw new AppError("Datos inválidos (empleado_id y turnos son requeridos).");
    }

    const resultados = await planificacionService.savePlanificacionesBulk(empleado_id, turnos);
    res.status(201).json({
        mensaje: "Planificaciones guardadas/actualizadas.",
        count: resultados.length,
        datos: resultados
    });
});

const updateEstadoPlanificacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estado_id, motivo_revision } = req.body;
    if (!estado_id) throw new AppError("Falta el estado_id.");
    const actualizado = await planificacionService.updateEstadoPlanificacion(id, estado_id, motivo_revision || null);
    if (!actualizado) throw new AppError("Planificación no encontrada.", 404);
    res.json(actualizado);
});

module.exports = {
    getAllPlanificaciones,
    getPlanificacionByEmpleado,
    createPlanificacion,
    deletePlanificacion,
    savePlanificacionesBulk,
    updateEstadoPlanificacion
};
