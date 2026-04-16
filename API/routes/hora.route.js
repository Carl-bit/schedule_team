const express = require('express');
const router = express.Router();
const horaController = require('../controllers/hora.controller');
const { validate } = require('../middleware/validate');

router.get('/', horaController.getHoras);
router.get('/:empleado_id', horaController.getHorasByEmpleado);
router.post('/', validate(['empleado_id']), horaController.iniciarJornada);
router.patch('/:id/terminar', horaController.terminarJornada);
router.put('/:id/cerrar', horaController.cerrarManual);
router.patch('/:id/estado', horaController.updateEstadoHora);
router.delete('/:id', horaController.deleteHora);

module.exports = router;
