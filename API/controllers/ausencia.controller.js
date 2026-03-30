const ausenciaService = require('../services/ausencia.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getAusencias = asyncHandler(async (req, res) => {
    const ausencias = await ausenciaService.getAusencias();
    res.json(ausencias);
});

const getAusenciasByEmpleado = asyncHandler(async (req, res) => {
    const { empleado_id } = req.params;
    const ausencias = await ausenciaService.getAusenciasByEmpleado(empleado_id);
    res.json(ausencias);
});

const createAusencia = asyncHandler(async (req, res) => {
    const { empleado_id, tipo_ausencia_id, inicio, fin } = req.body;
    const nuevaAusencia = await ausenciaService.createAusencia(empleado_id, tipo_ausencia_id, inicio, fin);
    res.status(201).json(nuevaAusencia);
});

const deleteAusencia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ausenciaBorrada = await ausenciaService.deleteAusencia(id);
    if (!ausenciaBorrada) throw new AppError("No encontré esa ausencia.", 404);
    res.json({ mensaje: "Ausencia eliminada.", datos: ausenciaBorrada });
});

const updateEstadoAusencia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estado_id } = req.body;
    if (!estado_id) throw new AppError("Falta el estado_id.");
    const actualizado = await ausenciaService.updateEstadoAusencia(id, estado_id);
    if (!actualizado) throw new AppError("Ausencia no encontrada.", 404);
    res.json(actualizado);
});

module.exports = {
    getAusencias,
    getAusenciasByEmpleado,
    createAusencia,
    deleteAusencia,
    updateEstadoAusencia
};
