const express = require('express');
const router = express.Router();
const asignacionController = require('../controllers/asignaciones.controller');
const { validate } = require('../middleware/validate');

router.get('/', asignacionController.getAsignaciones);
router.post('/', validate(['empleado_id', 'proyecto_id', 'rol_trabajo_id']), asignacionController.createAsignacion);
router.put('/:id', validate(['rol_trabajo_id']), asignacionController.updateAsignacion);
router.delete('/:id', asignacionController.deleteAsignacion);

module.exports = router;
