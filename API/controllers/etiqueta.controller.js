const EtiquetaService = require('../services/etiqueta.service');

const getEtiquetas = async (req, res) => {
    try {
        const { empleado_id } = req.params;
        const etiquetas = await EtiquetaService.getEtiquetasByEmpleado(empleado_id);
        res.status(200).json(etiquetas);
    } catch (error) {
        console.error('Error fetching labels:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createEtiqueta = async (req, res) => {
    try {
        const newEtiqueta = await EtiquetaService.createEtiqueta(req.body);
        res.status(201).json(newEtiqueta);
    } catch (error) {
        console.error('Error creating label:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateEtiqueta = async (req, res) => {
    try {
        const { etiqueta_id } = req.params;
        const { empleado_id, ...data } = req.body;
        const updated = await EtiquetaService.updateEtiqueta(etiqueta_id, empleado_id, data);
        if (updated) {
            res.status(200).json(updated);
        } else {
            res.status(404).json({ error: 'Etiqueta not found' });
        }
    } catch (error) {
        console.error('Error updating label:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteEtiqueta = async (req, res) => {
    try {
        const { etiqueta_id, empleado_id } = req.params; // or passing empleado_id via query
        const deleted = await EtiquetaService.deleteEtiqueta(etiqueta_id, req.query.empleado_id || req.body.empleado_id);
        if (deleted) {
            res.status(200).json({ message: 'Etiqueta deleted' });
        } else {
            res.status(404).json({ error: 'Etiqueta not found' });
        }
    } catch (error) {
        console.error('Error deleting label:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getEtiquetas,
    createEtiqueta,
    updateEtiqueta,
    deleteEtiqueta
};
