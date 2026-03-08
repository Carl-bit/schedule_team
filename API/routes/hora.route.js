const express = require('express');
const router = express.Router();
const horaController = require('../controllers/hora.controller');

router.get('/', horaController.getHoras);
router.get('/:empleado_id', horaController.getHorasByEmpleado);
router.post('/', horaController.iniciarJornada);
router.patch('/:id/terminar', horaController.terminarJornada);
router.put('/:id/cerrar', horaController.cerrarManual);

// NUEVO: Ruta para borrar
router.delete('/:id', horaController.deleteHora);

module.exports = router;