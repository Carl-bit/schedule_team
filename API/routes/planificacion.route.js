const express = require('express');
const router = express.Router();
const planificacionController = require('../controllers/planificacion.controller');

router.get('/', planificacionController.getAllPlanificaciones);
router.get('/:empleado_id', planificacionController.getPlanificacionByEmpleado);
router.post('/:empleado_id', planificacionController.createPlanificacion);
router.post('/bulk/:empleado_id', planificacionController.savePlanificacionesBulk);
router.delete('/:id', planificacionController.deletePlanificacion);
router.patch('/:id/estado', planificacionController.updateEstadoPlanificacion);

module.exports = router;
