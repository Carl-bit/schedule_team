const express = require('express');
const router = express.Router(); // 1. Creamos al recepcionista

// 2. Importamos al especialista (El Controlador que creamos antes)
const authController = require('../controllers/auth.controller');

// 3. Definimos la instrucción:
// "Cuando llegue alguien buscando '/login' usando POST...
// ...mándalo con el Sr. authController para que ejecute loginEmpleado"
router.post('/login', authController.loginEmpleado);
router.post('/logout', authController.logout);
// 4. Exportamos al recepcionista para que el edificio principal (server.js) lo conozca
module.exports = router;