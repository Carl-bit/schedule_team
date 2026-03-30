const solicitudService = require('../services/solicitud.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getSolicitudes = asyncHandler(async (req, res) => {
    const data = await solicitudService.getSolicitudes();
    res.json(data);
});

const getSolicitudesByEmpleado = asyncHandler(async (req, res) => {
    const data = await solicitudService.getSolicitudesByEmpleado(req.params.id);
    res.json(data);
});

const getSolicitudesByLider = asyncHandler(async (req, res) => {
    const data = await solicitudService.getSolicitudesByLider(req.params.id);
    res.json(data);
});

const createSolicitud = asyncHandler(async (req, res) => {
    const { empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin } = req.body;
    const data = await solicitudService.createSolicitud(empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin);
    res.status(201).json(data);
});

const updateEstado = asyncHandler(async (req, res) => {
    const { estado, motivo_rechazo } = req.body;
    if (!estado) throw new AppError("Se requiere el campo estado.");
    const data = await solicitudService.updateEstadoSolicitud(req.params.id, estado, motivo_rechazo);
    if (!data) throw new AppError("Solicitud no encontrada.", 404);
    res.json(data);
});

const reasignar = asyncHandler(async (req, res) => {
    const { empleado_id } = req.body;
    if (!empleado_id) throw new AppError("Se requiere empleado_id.");
    const data = await solicitudService.reasignarSolicitud(req.params.id, empleado_id);
    if (!data) throw new AppError("Solicitud no encontrada.", 404);
    res.json(data);
});

module.exports = {
    getSolicitudes,
    getSolicitudesByEmpleado,
    getSolicitudesByLider,
    createSolicitud,
    updateEstado,
    reasignar
};
