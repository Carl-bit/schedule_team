const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogo.controller');

// Rutas para obtener las listas
router.get('/roles', catalogoController.getRoles);
router.get('/estados', catalogoController.getEstados);
router.get('/ausencias', catalogoController.getAusencias);
router.get('/puestos', catalogoController.getPuestos);

// CRUD Puestos
router.post('/puestos', catalogoController.createPuesto);
router.delete('/puestos/:id', catalogoController.deletePuesto);

// CRUD Roles
router.post('/roles', catalogoController.createRol);
router.delete('/roles/:id', catalogoController.deleteRol);

// CRUD Estados
router.post('/estados', catalogoController.createEstado);
router.delete('/estados/:id', catalogoController.deleteEstado);

// CRUD Tipos de Ausencia
router.post('/ausencias', catalogoController.createTipoAusencia);
router.delete('/ausencias/:id', catalogoController.deleteTipoAusencia);

module.exports = router;