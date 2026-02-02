const express = require('express');
const router = express.Router();
const asignacionController = require('../controllers/asignaciones.controller');

router.get('/', asignacionController.getAsignaciones);
router.post('/', asignacionController.createAsignacion);
router.delete('/:id', asignacionController.deleteAsignacion);

module.exports = router;