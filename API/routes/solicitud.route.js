const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');

// GET todas las solicitudes
router.get('/', solicitudController.getSolicitudes);

// GET solicitudes por empleado
router.get('/empleado/:id', solicitudController.getSolicitudesByEmpleado);

// GET solicitudes creadas por líder
router.get('/lider/:id', solicitudController.getSolicitudesByLider);

// POST crear solicitud
router.post('/', solicitudController.createSolicitud);

// PATCH actualizar estado (aceptar/rechazar)
router.patch('/:id/estado', solicitudController.updateEstado);

// PATCH reasignar solicitud rechazada a otro empleado
router.patch('/:id/reasignar', solicitudController.reasignar);

module.exports = router;
