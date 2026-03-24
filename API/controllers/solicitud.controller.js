const solicitudService = require('../services/solicitud.service');

// GET /solicitudes
const getSolicitudes = async (req, res) => {
    try {
        const data = await solicitudService.getSolicitudes();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
};

// GET /solicitudes/empleado/:id
const getSolicitudesByEmpleado = async (req, res) => {
    try {
        const data = await solicitudService.getSolicitudesByEmpleado(req.params.id);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener solicitudes del empleado' });
    }
};

// GET /solicitudes/lider/:id
const getSolicitudesByLider = async (req, res) => {
    try {
        const data = await solicitudService.getSolicitudesByLider(req.params.id);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener solicitudes del líder' });
    }
};

// POST /solicitudes
const createSolicitud = async (req, res) => {
    try {
        const { empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin } = req.body;
        if (!empleado_id || !creado_por || !motivo || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        const data = await solicitudService.createSolicitud(empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin);
        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear solicitud' });
    }
};

// PATCH /solicitudes/:id/estado
const updateEstado = async (req, res) => {
    try {
        const { estado, motivo_rechazo } = req.body;
        if (!estado) {
            return res.status(400).json({ error: 'Se requiere el campo estado' });
        }
        const data = await solicitudService.updateEstadoSolicitud(req.params.id, estado, motivo_rechazo);
        if (!data) return res.status(404).json({ error: 'Solicitud no encontrada' });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
};

// PATCH /solicitudes/:id/reasignar
const reasignar = async (req, res) => {
    try {
        const { empleado_id } = req.body;
        if (!empleado_id) {
            return res.status(400).json({ error: 'Se requiere empleado_id' });
        }
        const data = await solicitudService.reasignarSolicitud(req.params.id, empleado_id);
        if (!data) return res.status(404).json({ error: 'Solicitud no encontrada' });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al reasignar solicitud' });
    }
};

module.exports = {
    getSolicitudes,
    getSolicitudesByEmpleado,
    getSolicitudesByLider,
    createSolicitud,
    updateEstado,
    reasignar
};
