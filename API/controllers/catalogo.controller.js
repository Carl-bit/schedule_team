const catalogoService = require('../services/catalogo.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const manejarRespuesta = (res, datos, nombreCatalogo) => {
    if (!datos || datos.length === 0) {
        return res.status(404).json({
            mensaje: `El catálogo de ${nombreCatalogo} está vacío.`,
            tip: "Ejecuta los seeds.sql en tu base de datos."
        });
    }
    res.json(datos);
};

const getRoles = asyncHandler(async (req, res) => {
    const roles = await catalogoService.getRoles();
    manejarRespuesta(res, roles, "Roles");
});

const getEstados = asyncHandler(async (req, res) => {
    const estados = await catalogoService.getEstados();
    manejarRespuesta(res, estados, "Estados");
});

const getAusencias = asyncHandler(async (req, res) => {
    const ausencias = await catalogoService.getAusencias();
    manejarRespuesta(res, ausencias, "Tipos de Ausencia");
});

const getPuestos = asyncHandler(async (req, res) => {
    const puestos = await catalogoService.getPuestos();
    manejarRespuesta(res, puestos, "Puestos de Empleado");
});

// --- PUESTOS ---
const createPuesto = asyncHandler(async (req, res) => {
    const { nombre } = req.body;
    const nuevoPuesto = await catalogoService.createPuesto(nombre);
    res.status(201).json(nuevoPuesto);
});

const deletePuesto = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const puestoBorrado = await catalogoService.deletePuesto(id);
    if (!puestoBorrado) throw new AppError("Ese puesto no existe.", 404);
    res.json({ mensaje: "Puesto eliminado del catálogo.", datos: puestoBorrado });
});

const updatePuesto = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) throw new AppError("Falta el nombre.");
    const updated = await catalogoService.updatePuesto(id, nombre);
    if (!updated) throw new AppError("Puesto no encontrado.", 404);
    res.json(updated);
});

// --- ROLES ---
const createRol = asyncHandler(async (req, res) => {
    const { rol_trabajo_id, rol_trabajo } = req.body;
    if (!rol_trabajo) throw new AppError("El rol necesita un nombre.");
    const nuevoRol = await catalogoService.createRol(rol_trabajo_id, rol_trabajo);
    res.status(201).json(nuevoRol);
});

const deleteRol = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rolBorrado = await catalogoService.deleteRol(id);
    if (!rolBorrado) throw new AppError("Ese rol no existe.", 404);
    res.json({ mensaje: "Rol eliminado del catálogo.", datos: rolBorrado });
});

const updateRol = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rol_trabajo } = req.body;
    if (!rol_trabajo) throw new AppError("Falta el nombre del rol.");
    const updated = await catalogoService.updateRol(id, rol_trabajo);
    if (!updated) throw new AppError("Rol no encontrado.", 404);
    res.json(updated);
});

// --- ESTADOS ---
const createEstado = asyncHandler(async (req, res) => {
    const { estado } = req.body;
    if (!estado) throw new AppError("El estado necesita un nombre.");
    const nuevoEstado = await catalogoService.createEstado(estado);
    res.status(201).json(nuevoEstado);
});

const deleteEstado = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const estadoBorrado = await catalogoService.deleteEstado(id);
    if (!estadoBorrado) throw new AppError("Ese estado no existe.", 404);
    res.json({ mensaje: "Estado eliminado del catálogo.", datos: estadoBorrado });
});

const updateEstado = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) throw new AppError("Falta el nombre del estado.");
    const updated = await catalogoService.updateEstado(id, estado);
    if (!updated) throw new AppError("Estado no encontrado.", 404);
    res.json(updated);
});

// --- TIPOS DE AUSENCIA ---
const createTipoAusencia = asyncHandler(async (req, res) => {
    const { tipo_id, descripcion, requiere_aprobacion } = req.body;
    if (!descripcion) throw new AppError("El tipo de ausencia necesita una descripción.");
    const nuevoTipo = await catalogoService.createTipoAusencia(tipo_id, descripcion, requiere_aprobacion);
    res.status(201).json(nuevoTipo);
});

const deleteTipoAusencia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tipoBorrado = await catalogoService.deleteTipoAusencia(id);
    if (!tipoBorrado) throw new AppError("Ese tipo de ausencia no existe.", 404);
    res.json({ mensaje: "Tipo de ausencia eliminado.", datos: tipoBorrado });
});

const updateTipoAusencia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { descripcion, requiere_aprobacion } = req.body;
    const updated = await catalogoService.updateTipoAusencia(id, descripcion, requiere_aprobacion);
    if (!updated) throw new AppError("Tipo de ausencia no encontrado.", 404);
    res.json(updated);
});

module.exports = {
    getRoles,
    getEstados,
    getAusencias,
    getPuestos,
    createPuesto,
    deletePuesto,
    updatePuesto,
    createRol,
    deleteRol,
    updateRol,
    createEstado,
    deleteEstado,
    updateEstado,
    createTipoAusencia,
    deleteTipoAusencia,
    updateTipoAusencia
};
