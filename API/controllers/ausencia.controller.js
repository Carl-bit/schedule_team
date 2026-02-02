const ausenciaService = require('../services/ausencia.service');
const { obtenerFraseAleatoria } = require('../utils/naas');

const getAusencias = async (req, res) => {
    try {
        const ausencias = await ausenciaService.getAusencias();

        if (ausencias.length === 0) {
            return res.status(404).json({
                mensaje: "Todos están trabajando (o nadie ha avisado que falta).",
                frase: obtenerFraseAleatoria()
            });
        }
        res.json(ausencias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const createAusencia = async (req, res) => {
    try {
        const { empleado_id, tipo_ausencia_id, inicio, fin } = req.body;

        if (!empleado_id || !tipo_ausencia_id || !inicio || !fin) {
            return res.status(400).json({
                error: "Faltan datos para procesar la ausencia.",
                frase: obtenerFraseAleatoria()
            });
        }

        const nuevaAusencia = await ausenciaService.createAusencia(empleado_id, tipo_ausencia_id, inicio, fin);
        res.status(201).json(nuevaAusencia);

    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: "El empleado o el tipo de ausencia no existen.",
                frase: obtenerFraseAleatoria()
            });
        }
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

const deleteAusencia = async (req, res) => {
    try {
        const { id } = req.params;
        const ausenciaBorrada = await ausenciaService.deleteAusencia(id);

        if (!ausenciaBorrada) {
            return res.status(404).json({ error: "No encontré esa ausencia." });
        }
        res.json({ mensaje: "Ausencia eliminada (¡A trabajar!).", datos: ausenciaBorrada });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
};

module.exports = {
    getAusencias,
    createAusencia,
    deleteAusencia
};