const horaService = require('../services/hora.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getHoras = asyncHandler(async (req, res) => {
    const horas = await horaService.getHoras();
    res.json(horas);
});

const getHorasByEmpleado = asyncHandler(async (req, res) => {
    const { empleado_id } = req.params;
    if (!empleado_id) throw new AppError("Falta el empleado_id.");
    const horas = await horaService.getHorasByEmpleado(empleado_id);
    res.json(horas);
});

const iniciarJornada = asyncHandler(async (req, res) => {
    const { empleado_id } = req.body;

    const turnoAbierto = await horaService.verificarSiTrabaja(empleado_id);
    if (turnoAbierto) {
        return res.status(409).json({
            error: "¡Ya estás trabajando! Cierra tu turno anterior primero.",
            turno_pendiente: turnoAbierto
        });
    }

    const nuevoRegistro = await horaService.iniciarJornada(empleado_id);
    res.status(201).json(nuevoRegistro);
});

const terminarJornada = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const registroActualizado = await horaService.terminarJornada(id);
    if (!registroActualizado) throw new AppError("Registro no encontrado.", 404);
    res.json(registroActualizado);
});

const cerrarManual = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fin_trabajo } = req.body;
    if (!fin_trabajo) throw new AppError("Falta proporcionar la hora de cierre.");
    const registroActualizado = await horaService.cerrarManual(id, fin_trabajo);
    if (!registroActualizado) throw new AppError("Registro no encontrado.", 404);
    res.json(registroActualizado);
});

const deleteHora = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const horaBorrada = await horaService.deleteHora(id);
    if (!horaBorrada) throw new AppError("Ese registro no existe.", 404);
    res.json({ mensaje: "Registro de hora eliminado.", datos: horaBorrada });
});

module.exports = {
    getHoras,
    getHorasByEmpleado,
    iniciarJornada,
    terminarJornada,
    cerrarManual,
    deleteHora
};
