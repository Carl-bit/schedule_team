const proyectoService = require('../services/proyecto.service');
const { obtenerFraseAleatoria } = require('../utils/naas');

const getProyectos = async (req, res) => {
    try {
        const proyectos = await proyectoService.getProyectos();
        res.json(proyectos); // Simplificamos para no repetir el código
    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const createProyecto = async (req, res) => {
    try {
        // Si fecha_entrega no viene, le asignamos null automáticamente
        const { nombre, cliente, fecha_inicio, fecha_entrega = null } = req.body;
        if (!nombre || !fecha_inicio) {
            return res.status(400).json({ error: "Faltan datos obligatorios.", frase: obtenerFraseAleatoria() });
        }
        const nuevoProyecto = await proyectoService.createProyecto(nombre, cliente, fecha_inicio, fecha_entrega);
        res.status(201).json(nuevoProyecto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// --- NUEVAS FUNCIONES ---

const getProyectoById = async (req, res) => {
    try {
        const { id } = req.params;
        const proyecto = await proyectoService.getProyectoById(id);

        if (!proyecto) {
            return res.status(404).json({ error: "Proyecto no encontrado.", frase: obtenerFraseAleatoria() });
        }
        res.json(proyecto);
    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const updateProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, cliente, fecha_inicio, fecha_entrega } = req.body;

        const proyectoActualizado = await proyectoService.updateProyecto(id, nombre, cliente, fecha_inicio, fecha_entrega);

        if (!proyectoActualizado) {
            return res.status(404).json({ error: "No encontré ese proyecto para actualizar." });
        }
        res.json(proyectoActualizado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deleteProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const proyectoBorrado = await proyectoService.deleteProyecto(id);

        if (!proyectoBorrado) {
            return res.status(404).json({ error: "No existe ese proyecto." });
        }
        res.json({ mensaje: "Proyecto eliminado (espero que no fuera importante).", datos: proyectoBorrado });

    } catch (error) {
        console.error(error);
        // Error 23503: Tiene asignaciones vinculadas
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrar este proyecto: Hay gente asignada a él.",
                solucion: "Borra primero las asignaciones.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getProyectos,
    getProyectoById,
    createProyecto,
    updateProyecto,
    deleteProyecto
};