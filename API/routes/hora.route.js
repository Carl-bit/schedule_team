const express = require('express');
const router = express.Router();
const horaController = require('../controllers/hora.controller');

router.get('/', horaController.getHoras);
router.post('/', horaController.iniciarJornada);
router.patch('/:id/terminar', horaController.terminarJornada);

// NUEVO: Ruta para borrar
router.delete('/:id', horaController.deleteHora);

module.exports = router;