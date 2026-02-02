const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyecto.controller');

// CRUD COMPLETO
router.get('/', proyectoController.getProyectos);          // Ver todos
router.get('/:id', proyectoController.getProyectoById);    // Ver uno
router.post('/', proyectoController.createProyecto);       // Crear
router.put('/:id', proyectoController.updateProyecto);     // Actualizar
router.delete('/:id', proyectoController.deleteProyecto);  // Borrar

module.exports = router;