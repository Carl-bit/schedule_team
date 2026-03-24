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
router.put('/puestos/:id', catalogoController.updatePuesto);
router.delete('/puestos/:id', catalogoController.deletePuesto);

// CRUD Roles
router.post('/roles', catalogoController.createRol);
router.put('/roles/:id', catalogoController.updateRol);
router.delete('/roles/:id', catalogoController.deleteRol);

// CRUD Estados
router.post('/estados', catalogoController.createEstado);
router.put('/estados/:id', catalogoController.updateEstado);
router.delete('/estados/:id', catalogoController.deleteEstado);

// CRUD Tipos de Ausencia
router.post('/ausencias', catalogoController.createTipoAusencia);
router.put('/ausencias/:id', catalogoController.updateTipoAusencia);
router.delete('/ausencias/:id', catalogoController.deleteTipoAusencia);

module.exports = router;