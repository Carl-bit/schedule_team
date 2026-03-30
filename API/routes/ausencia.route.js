const express = require('express');
const router = express.Router();
const ausenciaController = require('../controllers/ausencia.controller');
const { validate } = require('../middleware/validate');

router.get('/', ausenciaController.getAusencias);
router.get('/:empleado_id', ausenciaController.getAusenciasByEmpleado);
router.post('/', validate(['empleado_id', 'tipo_ausencia_id', 'inicio', 'fin']), ausenciaController.createAusencia);
router.delete('/:id', ausenciaController.deleteAusencia);
router.patch('/:id/estado', ausenciaController.updateEstadoAusencia);

module.exports = router;
