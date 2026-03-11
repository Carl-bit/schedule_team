const catalogoService = require('../services/catalogo.service');
const { obtenerFraseAleatoria } = require('../utils/naas/naas');

// Función genérica para manejar las respuestas y no repetir código
const manejarRespuesta = (res, datos, nombreCatalogo) => {
    if (!datos || datos.length === 0) {
        return res.status(404).json({
            mensaje: `El catálogo de ${nombreCatalogo} está vacío.`,
            tip: "Ejecuta los seeds.sql en tu base de datos.",
            frase: obtenerFraseAleatoria()
        });
    }
    res.json(datos);
};

const getRoles = async (req, res) => {
    try {
        const roles = await catalogoService.getRoles();
        manejarRespuesta(res, roles, "Roles");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const getEstados = async (req, res) => {
    try {
        const estados = await catalogoService.getEstados();
        manejarRespuesta(res, estados, "Estados");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const getAusencias = async (req, res) => {
    try {
        const ausencias = await catalogoService.getAusencias();
        manejarRespuesta(res, ausencias, "Tipos de Ausencia");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const getPuestos = async (req, res) => {
    try {
        const puestos = await catalogoService.getPuestos();
        manejarRespuesta(res, puestos, "Puestos de Empleado");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const createPuesto = async (req, res) => {
    try {
        const { nombre } = req.body; // Esperamos { "nombre": "Nuevo Cargo" }

        if (!nombre) {
            return res.status(400).json({
                error: "El puesto necesita un nombre.",
                frase: obtenerFraseAleatoria()
            });
        }

        const nuevoPuesto = await catalogoService.createPuesto(nombre);
        res.status(201).json(nuevoPuesto);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deletePuesto = async (req, res) => {
    try {
        const { id } = req.params;
        const puestoBorrado = await catalogoService.deletePuesto(id);
        if (!puestoBorrado) {
            return res.status(404).json({ error: "Ese puesto no existe." });
        }
        res.json({ mensaje: "Puesto eliminado del catálogo.", datos: puestoBorrado });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrar este puesto: Hay empleados asignados a él.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// --- ROLES ---
const createRol = async (req, res) => {
    try {
        const { rol_trabajo_id, rol_trabajo } = req.body;
        if (!rol_trabajo) {
            return res.status(400).json({ error: "El rol necesita un nombre." });
        }
        const nuevoRol = await catalogoService.createRol(rol_trabajo_id, rol_trabajo);
        res.status(201).json(nuevoRol);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deleteRol = async (req, res) => {
    try {
        const { id } = req.params;
        const rolBorrado = await catalogoService.deleteRol(id);
        if (!rolBorrado) {
            return res.status(404).json({ error: "Ese rol no existe." });
        }
        res.json({ mensaje: "Rol eliminado del catálogo.", datos: rolBorrado });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrar este rol: Hay asignaciones usándolo.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// --- ESTADOS ---
const createEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!estado) {
            return res.status(400).json({ error: "El estado necesita un nombre." });
        }
        const nuevoEstado = await catalogoService.createEstado(estado);
        res.status(201).json(nuevoEstado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deleteEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const estadoBorrado = await catalogoService.deleteEstado(id);
        if (!estadoBorrado) {
            return res.status(404).json({ error: "Ese estado no existe." });
        }
        res.json({ mensaje: "Estado eliminado del catálogo.", datos: estadoBorrado });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrar este estado: Hay registros usándolo.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

// --- TIPOS DE AUSENCIA ---
const createTipoAusencia = async (req, res) => {
    try {
        const { tipo_id, descripcion, requiere_aprobacion } = req.body;
        if (!descripcion) {
            return res.status(400).json({ error: "El tipo de ausencia necesita una descripción." });
        }
        const nuevoTipo = await catalogoService.createTipoAusencia(tipo_id, descripcion, requiere_aprobacion);
        res.status(201).json(nuevoTipo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deleteTipoAusencia = async (req, res) => {
    try {
        const { id } = req.params;
        const tipoBorrado = await catalogoService.deleteTipoAusencia(id);
        if (!tipoBorrado) {
            return res.status(404).json({ error: "Ese tipo de ausencia no existe." });
        }
        res.json({ mensaje: "Tipo de ausencia eliminado.", datos: tipoBorrado });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrar este tipo: Hay ausencias registradas con él.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getRoles,
    getEstados,
    getAusencias,
    getPuestos,
    createPuesto,
    deletePuesto,
    createRol,
    deleteRol,
    createEstado,
    deleteEstado,
    createTipoAusencia,
    deleteTipoAusencia
};