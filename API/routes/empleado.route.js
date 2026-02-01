// routes/empleado.routes.js
const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado.controller');

// Definimos la ruta: Cuando alguien pida GET / (en este grupo), llama al controlador
router.get('/', empleadoController.getEmpleados);

module.exports = router;