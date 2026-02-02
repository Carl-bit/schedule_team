const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado.controller');

// CRUD Completo
router.get('/', empleadoController.getEmpleados);           // Ver todos
router.get('/:id', empleadoController.getEmpleadoById);     // Ver uno específico
router.post('/', empleadoController.createEmpleado);        // Crear (Contratar)
router.put('/:id', empleadoController.updateEmpleado);      // Editar
router.delete('/:id', empleadoController.deleteEmpleado);   // Despedir

module.exports = router;