const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogo.controller');

// Rutas para obtener las listas
router.get('/roles', catalogoController.getRoles);
router.get('/estados', catalogoController.getEstados);
router.get('/ausencias', catalogoController.getAusencias);
router.get('/puestos', catalogoController.getPuestos);
// Crear un nuevo puesto
router.post('/puestos', catalogoController.createPuesto);
// Borrar un puesto (necesita ID en la URL)
router.delete('/puestos/:id', catalogoController.deletePuesto);


module.exports = router;