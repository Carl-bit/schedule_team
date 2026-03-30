const proyectoService = require('../services/proyecto.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getProyectos = asyncHandler(async (req, res) => {
    const proyectos = await proyectoService.getProyectos();
    res.json(proyectos);
});

const getProyectoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const proyecto = await proyectoService.getProyectoById(id);
    if (!proyecto) throw new AppError("Proyecto no encontrado.", 404);
    res.json(proyecto);
});

const createProyecto = asyncHandler(async (req, res) => {
    const { nombre, cliente, fecha_inicio, fecha_entrega = null } = req.body;
    const nuevoProyecto = await proyectoService.createProyecto(nombre, cliente, fecha_inicio, fecha_entrega);
    res.status(201).json(nuevoProyecto);
});

const updateProyecto = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, cliente, fecha_inicio, fecha_entrega } = req.body;
    const proyectoActualizado = await proyectoService.updateProyecto(id, nombre, cliente, fecha_inicio, fecha_entrega);
    if (!proyectoActualizado) throw new AppError("No encontré ese proyecto para actualizar.", 404);
    res.json(proyectoActualizado);
});

const deleteProyecto = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const proyectoBorrado = await proyectoService.deleteProyecto(id);
    if (!proyectoBorrado) throw new AppError("No existe ese proyecto.", 404);
    res.json({ mensaje: "Proyecto eliminado.", datos: proyectoBorrado });
});

module.exports = {
    getProyectos,
    getProyectoById,
    createProyecto,
    updateProyecto,
    deleteProyecto
};
