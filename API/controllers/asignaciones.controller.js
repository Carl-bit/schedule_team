const asignacionService = require('../services/asignaciones.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getAsignaciones = asyncHandler(async (req, res) => {
    const asignaciones = await asignacionService.getAsignaciones();
    res.json(asignaciones);
});

const createAsignacion = asyncHandler(async (req, res) => {
    const { empleado_id, proyecto_id, rol_trabajo_id } = req.body;
    const nuevaAsignacion = await asignacionService.createAsignacion(empleado_id, proyecto_id, rol_trabajo_id);
    res.status(201).json(nuevaAsignacion);
});

const deleteAsignacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const asignacionBorrada = await asignacionService.deleteAsignacion(id);
    if (!asignacionBorrada) throw new AppError("Esa asignación no existe.", 404);
    res.json({ mensaje: "Empleado removido del proyecto.", datos: asignacionBorrada });
});

const updateAsignacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rol_trabajo_id } = req.body;
    const asignacionActualizada = await asignacionService.updateAsignacion(id, rol_trabajo_id);
    if (!asignacionActualizada) throw new AppError("Asignación no encontrada.", 404);
    res.json(asignacionActualizada);
});

module.exports = {
    getAsignaciones,
    createAsignacion,
    deleteAsignacion,
    updateAsignacion
};
