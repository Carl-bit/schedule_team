const express = require('express');
const router = express.Router();
const ausenciaController = require('../controllers/ausencia.controller');

router.get('/', ausenciaController.getAusencias);
router.get('/:empleado_id', ausenciaController.getAusenciasByEmpleado);
router.post('/', ausenciaController.createAusencia);
router.delete('/:id', ausenciaController.deleteAusencia);
router.patch('/:id/estado', ausenciaController.updateEstadoAusencia);

module.exports = router;