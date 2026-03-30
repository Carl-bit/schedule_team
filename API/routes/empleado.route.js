const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado.controller');
const { validate } = require('../middleware/validate');

router.get('/', empleadoController.getEmpleados);
router.get('/:id', empleadoController.getEmpleadoById);
router.post('/', validate(['nombre', 'correo', 'password', 'alias', 'telefono', 'puesto_id']), empleadoController.createEmpleado);
router.put('/:id', empleadoController.updateEmpleado);
router.put('/:id/password', empleadoController.changePassword);
router.delete('/:id', empleadoController.deleteEmpleado);

module.exports = router;
