const EtiquetaService = require('../services/etiqueta.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getEtiquetas = asyncHandler(async (req, res) => {
    const { empleado_id } = req.params;
    const etiquetas = await EtiquetaService.getEtiquetasByEmpleado(empleado_id);
    res.json(etiquetas);
});

const createEtiqueta = asyncHandler(async (req, res) => {
    const newEtiqueta = await EtiquetaService.createEtiqueta(req.body);
    res.status(201).json(newEtiqueta);
});

const updateEtiqueta = asyncHandler(async (req, res) => {
    const { etiqueta_id } = req.params;
    const { empleado_id, ...data } = req.body;
    const updated = await EtiquetaService.updateEtiqueta(etiqueta_id, empleado_id, data);
    if (!updated) throw new AppError("Etiqueta no encontrada.", 404);
    res.json(updated);
});

const deleteEtiqueta = asyncHandler(async (req, res) => {
    const { etiqueta_id } = req.params;
    const deleted = await EtiquetaService.deleteEtiqueta(etiqueta_id, req.query.empleado_id || req.body.empleado_id);
    if (!deleted) throw new AppError("Etiqueta no encontrada.", 404);
    res.json({ message: 'Etiqueta eliminada' });
});

module.exports = {
    getEtiquetas,
    createEtiqueta,
    updateEtiqueta,
    deleteEtiqueta
};
