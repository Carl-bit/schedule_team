const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');
const { validate } = require('../middleware/validate');

router.get('/', solicitudController.getSolicitudes);
router.get('/empleado/:id', solicitudController.getSolicitudesByEmpleado);
router.get('/lider/:id', solicitudController.getSolicitudesByLider);
router.post('/', validate(['empleado_id', 'creado_por', 'motivo', 'fecha_inicio', 'fecha_fin']), solicitudController.createSolicitud);
router.patch('/:id/estado', solicitudController.updateEstado);
router.patch('/:id/reasignar', solicitudController.reasignar);

module.exports = router;
