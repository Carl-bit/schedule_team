const asignacionService = require('../services/asignaciones.service');
const { obtenerFraseAleatoria } = require('../utils/naas');

const getAsignaciones = async (req, res) => {
    try {
        const asignaciones = await asignacionService.getAsignaciones();

        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Nadie está trabajando en nada... sospechoso.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.json(asignaciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const createAsignacion = async (req, res) => {
    try {
        const { empleado_id, proyecto_id, rol_trabajo_id } = req.body;

        if (!empleado_id || !proyecto_id || !rol_trabajo_id) {
            return res.status(400).json({
                error: "Faltan datos (empleado, proyecto o rol).",
                frase: obtenerFraseAleatoria()
            });
        }

        const nuevaAsignacion = await asignacionService.createAsignacion(empleado_id, proyecto_id, rol_trabajo_id);
        res.status(201).json(nuevaAsignacion);

    } catch (error) {
        console.error(error);
        // Error 23503: Llave foránea no encontrada (Empleado o Proyecto no existen)
        if (error.code === '23503') {
            return res.status(400).json({
                error: "Uno de los IDs (empleado, proyecto o rol) no existe en la base de datos.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deleteAsignacion = async (req, res) => {
    try {
        const { id } = req.params;
        const asignacionBorrada = await asignacionService.deleteAsignacion(id);

        if (!asignacionBorrada) {
            return res.status(404).json({ error: "Esa asignación no existe.", frase: obtenerFraseAleatoria() });
        }
        res.json({ mensaje: "Empleado removido del proyecto.", datos: asignacionBorrada });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getAsignaciones,
    createAsignacion,
    deleteAsignacion
};