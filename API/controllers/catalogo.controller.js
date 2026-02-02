const catalogoService = require('../services/catalogo.service');
const { obtenerFraseAleatoria } = require('../utils/naas');

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
        // Error 23503: Llave foránea. Significa que hay empleados usando este puesto.
        if (error.code === '23503') {
            return res.status(400).json({
                error: "No puedes borrar este puesto: Hay empleados asignados a él.",
                solucion: "Cambia de puesto a los empleados antes de borrar este cargo.",
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
    deletePuesto
};