const empleadoService = require('../services/empleado.service');
const { obtenerFraseAleatoria } = require('../utils/naas');

// GET: Todos
const getEmpleados = async (req, res) => {
    try {
        const empleados = await empleadoService.getEmpleados();
        res.json(empleados);
    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// GET: Uno solo
const getEmpleadoById = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await empleadoService.getEmpleadoById(id);

        if (!empleado) {
            return res.status(404).json({
                mensaje: "Empleado fantasma... no existe.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.json(empleado);
    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// POST: Crear
const createEmpleado = async (req, res) => {
    try {
        const { nombre, correo, password, puesto_id } = req.body;

        // Validación simple
        if (!nombre || !correo || !password || !puesto_id) {
            return res.status(400).json({
                error: "Faltan datos. No soy adivino.",
                frase: obtenerFraseAleatoria()
            });
        }

        const nuevoEmpleado = await empleadoService.createEmpleado(nombre, correo, password, puesto_id);
        res.status(201).json(nuevoEmpleado);

    } catch (error) {
        console.error(error);
        // Error código 23505 = Clave única violada (el correo ya existe)
        if (error.code === '23505') {
            return res.status(400).json({
                error: "Ese correo ya está registrado.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// PUT: Actualizar
const updateEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo } = req.body;

        const empleadoActualizado = await empleadoService.updateEmpleado(id, nombre, correo);

        if (!empleadoActualizado) {
            return res.status(404).json({ error: "No encontré a quién actualizar." });
        }
        res.json(empleadoActualizado);

    } catch (error) {
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// DELETE: Borrar
const deleteEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const empleadoBorrado = await empleadoService.deleteEmpleado(id);

        if (!empleadoBorrado) {
            return res.status(404).json({ error: "No se pudo borrar (¿quizás no existe?)." });
        }
        res.json({ mensaje: "Empleado eliminado correctamente", empleado: empleadoBorrado });

    } catch (error) {
        console.error(error);
        // Error 23503 = Llave foránea (El empleado tiene horas registradas o proyectos)
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrarlo: Tiene historial (horas o proyectos).",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado
};